# app/routers/inventory.py
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.deps import get_db, get_current_user
from app.models import User, MenuItem  # ✅ add MenuItem import
from app.models_pos import POSInventoryItem, POSStockEvent
from app.schemas_pos import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemRead,
    StockAdjust,
)

router = APIRouter()

EMPLOYEE_ROLES = {"admin", "manager", "employee", "cashier", "kitchen", "staff"}
MANAGER_ROLES = EMPLOYEE_ROLES


def _role(user: User) -> str:
    return str(getattr(user, "role", "") or "").strip().lower()


def require_employee(user: User = Depends(get_current_user)) -> User:
    if _role(user) not in EMPLOYEE_ROLES:
        raise HTTPException(status_code=403, detail="Employee access required")
    return user


def require_manager(user: User = Depends(get_current_user)) -> User:
    if _role(user) not in MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Manager access required")
    return user


def _get_item_or_404(db: Session, item_id: int) -> POSInventoryItem:
    item = db.query(POSInventoryItem).filter(POSInventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# -------------------------------------------------------------------
# ✅ NEW: Sync active customer menu pizzas/deals into POS inventory
# -------------------------------------------------------------------
def _pick_unique_sku(db: Session, base: str) -> str:
    """
    Generate a SKU that doesn't collide with existing inventory SKUs.
    Keeps it deterministic but safe.
    """
    candidates = [base, f"{base}-A", f"{base}-B", f"{base}-{int(datetime.utcnow().timestamp())}"]
    for sku in candidates:
        exists = db.query(POSInventoryItem).filter(POSInventoryItem.sku == sku).first()
        if not exists:
            return sku
    # fallback: last resort (should never happen)
    return f"{base}-{int(datetime.utcnow().timestamp())}"


def _sync_active_menu_to_inventory(db: Session) -> list[int]:
    """
    Ensures every ACTIVE MenuItem (customer menu) has a matching POSInventoryItem row.
    - Creates missing inventory rows
    - Keeps inventory 'name' in sync with menu item 'name'
    Returns list of active MenuItem IDs.
    """
    active_menu_items = db.query(MenuItem).filter(MenuItem.is_active == True).all()
    active_ids = [m.id for m in active_menu_items]

    # Existing inventory rows that are linked to menu items
    existing_by_menu_id = {
        inv.menu_item_id: inv
        for inv in db.query(POSInventoryItem)
        .filter(POSInventoryItem.menu_item_id.isnot(None))
        .all()
    }

    created_any = False
    updated_any = False

    for m in active_menu_items:
        inv = existing_by_menu_id.get(m.id)

        if not inv:
            base_sku = f"MENU-{m.id}"
            sku = _pick_unique_sku(db, base_sku)

            inv = POSInventoryItem(
                sku=sku,
                name=m.name.strip(),
                menu_item_id=m.id,
                current_qty=0,
                low_stock_threshold=5,
                is_out_of_stock=True,
                updated_at=datetime.utcnow(),
            )
            db.add(inv)
            created_any = True
        else:
            # Keep display name synced with MenuItem name
            new_name = m.name.strip()
            if inv.name != new_name:
                inv.name = new_name
                inv.updated_at = datetime.utcnow()
                updated_any = True

    if created_any or updated_any:
        db.commit()

    return active_ids


# ----------------------------
# CREATE (manager/admin)
# ----------------------------
@router.post("/items", response_model=InventoryItemRead, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager),
):
    # basic sanity
    if payload.current_qty < 0:
        raise HTTPException(status_code=400, detail="current_qty cannot be negative")
    if payload.low_stock_threshold < 0:
        raise HTTPException(status_code=400, detail="low_stock_threshold cannot be negative")

    item = POSInventoryItem(
        sku=(payload.sku.strip() if payload.sku else None),
        name=payload.name.strip(),
        menu_item_id=payload.menu_item_id,
        current_qty=payload.current_qty,
        low_stock_threshold=payload.low_stock_threshold,
        is_out_of_stock=payload.is_out_of_stock or (payload.current_qty <= 0),
        updated_at=datetime.utcnow(),
    )

    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="SKU already exists")

    db.refresh(item)
    return item


# ----------------------------
# READ (employee+)
# ----------------------------
@router.get("/items", response_model=list[InventoryItemRead])
def list_inventory(
    low_stock_only: bool = Query(default=False),
    q: Optional[str] = Query(default=None, description="Search by name or sku"),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    # ✅ NEW: Always sync menu -> inventory so pizzas show up automatically
    active_menu_ids = _sync_active_menu_to_inventory(db)

    query = db.query(POSInventoryItem)

    # ✅ NEW: Only show:
    # - manual inventory items (menu_item_id is NULL)
    # - OR inventory rows tied to ACTIVE menu items
    if active_menu_ids:
        query = query.filter(
            or_(
                POSInventoryItem.menu_item_id.is_(None),
                POSInventoryItem.menu_item_id.in_(active_menu_ids),
            )
        )
    else:
        # no active menu items; still show manual inventory
        query = query.filter(POSInventoryItem.menu_item_id.is_(None))

    if q:
        q_like = f"%{q.strip()}%"
        query = query.filter(
            (POSInventoryItem.name.ilike(q_like)) |
            (POSInventoryItem.sku.ilike(q_like))
        )

    # ✅ If low_stock_only is requested, apply it in query (faster + correct)
    if low_stock_only:
        query = query.filter(
            POSInventoryItem.is_out_of_stock == False,
            POSInventoryItem.current_qty <= POSInventoryItem.low_stock_threshold
        )

    items = query.order_by(POSInventoryItem.name.asc()).offset(offset).limit(limit).all()
    return items


@router.get("/items/{item_id}", response_model=InventoryItemRead)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    return _get_item_or_404(db, item_id)


# ----------------------------
# UPDATE (manager/admin)
# ----------------------------
@router.patch("/items/{item_id}", response_model=InventoryItemRead)
def update_inventory_item(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager),
):
    item = _get_item_or_404(db, item_id)

    # product fields
    if payload.sku is not None:
        item.sku = payload.sku.strip() if payload.sku else None
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.menu_item_id is not None:
        item.menu_item_id = payload.menu_item_id

    # inventory fields
    if payload.current_qty is not None:
        if payload.current_qty < 0:
            raise HTTPException(status_code=400, detail="current_qty cannot be negative")
        item.current_qty = payload.current_qty

    if payload.low_stock_threshold is not None:
        if payload.low_stock_threshold < 0:
            raise HTTPException(status_code=400, detail="low_stock_threshold cannot be negative")
        item.low_stock_threshold = payload.low_stock_threshold

    if payload.is_out_of_stock is not None:
        item.is_out_of_stock = payload.is_out_of_stock

    # auto out-of-stock safety
    if item.current_qty <= 0:
        item.is_out_of_stock = True

    item.updated_at = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="SKU already exists")

    db.refresh(item)
    return item


# ----------------------------
# DELETE (manager/admin)
# ----------------------------
@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager),
):
    item = _get_item_or_404(db, item_id)
    db.delete(item)
    db.commit()
    return None


# ----------------------------
# STOCK ADJUST (employee+)
# ----------------------------
@router.post("/items/{item_id}/adjust", response_model=InventoryItemRead)
def adjust_stock(
    item_id: int,
    payload: StockAdjust,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    item = _get_item_or_404(db, item_id)

    new_qty = item.current_qty + payload.change_qty
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Stock cannot go below 0")

    item.current_qty = new_qty
    item.is_out_of_stock = (item.current_qty <= 0)
    item.updated_at = datetime.utcnow()

    db.add(
        POSStockEvent(
            inventory_item_id=item_id,
            change_qty=payload.change_qty,
            reason=payload.reason,
            changed_by_employee_id=user.id,
        )
    )
    db.commit()
    db.refresh(item)
    return item


# ----------------------------
# Stock history per item (employee+)
# ----------------------------
@router.get("/items/{item_id}/events")
def list_stock_events(
    item_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    _ = _get_item_or_404(db, item_id)

    events = (
        db.query(POSStockEvent)
        .filter(POSStockEvent.inventory_item_id == item_id)
        .order_by(POSStockEvent.changed_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": e.id,
            "inventory_item_id": e.inventory_item_id,
            "change_qty": str(e.change_qty),
            "reason": e.reason,
            "changed_by_employee_id": e.changed_by_employee_id,
            "changed_at": e.changed_at,
        }
        for e in events
    ]
