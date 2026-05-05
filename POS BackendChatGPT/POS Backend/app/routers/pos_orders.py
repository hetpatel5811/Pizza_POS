# app/routers/pos_orders.py
from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from app.schemas_pos import OrderQuoteRequest, OrderQuoteResponse, OrderQuoteItem
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import User, MenuItem, Topping, CrustOption  # customer menu + toppings + crust options
from app.models_pos import (
    POSOrder,
    POSOrderItem,
    POSOrderStatusLog,
    POSOrderInstruction,
    OrderType as POSOrderType,
    OrderStatus as POSOrderStatus,
)
from app.schemas_pos import (
    OrderCreate,
    OrderRead,
    OrderStatusUpdate,
    OrderInstructionAdd,
)

router = APIRouter()


# -------------------------
# RBAC helpers (same pattern as your inventory router)
# -------------------------
EMPLOYEE_ROLES = {"admin", "manager", "employee", "cashier", "kitchen", "staff"}

def _role(user: User) -> str:
    return str(getattr(user, "role", "") or "").strip().lower()

def require_employee(user: User = Depends(get_current_user)) -> User:
    if _role(user) not in EMPLOYEE_ROLES:
        raise HTTPException(status_code=403, detail="Employee access required")
    return user


# -------------------------
# helpers
# -------------------------
def _now() -> datetime:
    return datetime.utcnow()

def _d2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _parse_order_type(raw: str, allowed: set[POSOrderType] | None = None) -> POSOrderType:
    if not raw:
        raise HTTPException(400, "order_type is required")
    key = raw.strip().upper()
    try:
        ot = POSOrderType[key]
    except KeyError:
        allowed_names = ", ".join([e.name for e in POSOrderType])
        raise HTTPException(400, f"Invalid order_type. Allowed: {allowed_names}")

    if allowed is not None and ot not in allowed:
        allowed_names = ", ".join([e.name for e in allowed])
        raise HTTPException(400, f"Invalid order_type for employee panel. Allowed: {allowed_names}")

    return ot

def _parse_status(raw: str) -> POSOrderStatus:
    if not raw:
        raise HTTPException(400, "to_status is required")
    key = raw.strip().upper()
    try:
        return POSOrderStatus[key]
    except KeyError:
        allowed = ", ".join([e.name for e in POSOrderStatus])
        raise HTTPException(400, f"Invalid status. Allowed: {allowed}")

def _get_order_or_404(db: Session, order_id: int) -> POSOrder:
    order = db.query(POSOrder).filter(POSOrder.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


def _get_order_for_update_or_404(db: Session, order_id: int) -> POSOrder:
    order = (
        db.query(POSOrder)
        .filter(POSOrder.id == order_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")
    return order


# Pricing rules (keep aligned with your customer orders.py)
EXTRA_CHEESE_PRICE = Decimal("1.00")
EXTRA_SAUCE_PRICE = Decimal("0.50")
LEGACY_CRUST_UPCHARGE = {
    "stuffed crust": Decimal("3.00"),
    "stuffed": Decimal("3.00"),
    "stuffed_crust": Decimal("3.00"),
}


def _normalize_key(value: Optional[str]) -> str:
    return " ".join((value or "").strip().lower().replace("-", " ").replace("_", " ").split())


def _menu_base_price(menu: MenuItem, size: Optional[str]) -> Decimal:
    s = (size or "").strip().lower()

    # menu prices are floats -> convert to Decimal safely
    ps = Decimal(str(menu.price_small)) if menu.price_small is not None else None
    pm = Decimal(str(menu.price_medium)) if menu.price_medium is not None else None
    pl = Decimal(str(menu.price_large)) if menu.price_large is not None else None

    # choose by size first
    if s == "small" and ps is not None:
        return ps
    if s == "medium" and pm is not None:
        return pm
    if s == "large" and pl is not None:
        return pl

    # fallback order: medium -> large -> small -> 0
    for v in (pm, pl, ps):
        if v is not None:
            return v
    return Decimal("0.00")


def _crust_price_adjustment(
    db: Session,
    crust: Optional[str],
    crust_option_id: Optional[int] = None,
) -> Decimal:
    if crust_option_id is not None:
        selected = db.query(CrustOption).filter(CrustOption.id == crust_option_id).first()
        if not selected or not selected.is_available:
            raise HTTPException(400, "Invalid crust option")
        return Decimal(str(selected.price_adjustment or 0))

    key = _normalize_key(crust)
    if not key:
        return Decimal("0.00")

    options = db.query(CrustOption).all()
    for option in options:
        if _normalize_key(option.name) == key:
            if not option.is_available:
                raise HTTPException(400, "Selected crust option is unavailable")
            return Decimal(str(option.price_adjustment or 0))

    return LEGACY_CRUST_UPCHARGE.get(key, Decimal("0.00"))


def _compute_unit_price(db: Session, menu: MenuItem, item) -> Decimal:
    base = _menu_base_price(menu, getattr(item, "size", None))

    extras = Decimal("0.00")
    if getattr(item, "extra_cheese", False):
        extras += EXTRA_CHEESE_PRICE
    if getattr(item, "extra_sauce", False):
        extras += EXTRA_SAUCE_PRICE

    crust_total = _crust_price_adjustment(
        db,
        getattr(item, "crust", None),
        getattr(item, "crust_option_id", None),
    )

    toppings_total = Decimal("0.00")
    toppings = getattr(item, "toppings", []) or []
    for t in toppings:
        topping = (
            db.query(Topping)
            .filter(Topping.id == t.topping_id, Topping.is_available == True)
            .first()
        )
        if not topping:
            raise HTTPException(400, f"Invalid topping_id: {t.topping_id}")
        toppings_total += Decimal(str(topping.price)) * Decimal(int(t.quantity))

    return _d2(base + extras + crust_total + toppings_total)


def _build_item_note(item) -> str:
    # keep a readable snapshot so kitchen knows exactly what was ordered
    parts = []

    if getattr(item, "size", None):
        parts.append(f"size={item.size}")
    if getattr(item, "crust", None):
        parts.append(f"crust={item.crust}")
    if getattr(item, "sauce", None):
        parts.append(f"sauce={item.sauce}")
    if getattr(item, "extra_cheese", False):
        parts.append("extra_cheese=yes")
    if getattr(item, "extra_sauce", False):
        parts.append("extra_sauce=yes")

    toppings = getattr(item, "toppings", []) or []
    if toppings:
        parts.append("toppings=" + ",".join([f"{t.topping_id}x{t.quantity}" for t in toppings]))

    if getattr(item, "special_instructions", None):
        parts.append(f"note={item.special_instructions}")

    return " | ".join(parts) if parts else None


# -------------------------
# CREATE POS ORDER (employee can place counter order)
# -------------------------
@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_pos_order(payload: OrderCreate, db: Session = Depends(get_db), user: User = Depends(require_employee)):
    order_type = _parse_order_type(payload.order_type, allowed={POSOrderType.DINE_IN, POSOrderType.TAKEAWAY})

    if order_type == POSOrderType.DINE_IN:
        if not payload.table_no:
            raise HTTPException(400, "table_no is required for DINE_IN")
        payload.delivery_address_text = None

    elif order_type == POSOrderType.TAKEAWAY:
        payload.table_no = None
        payload.delivery_address_text = None

    if not payload.items:
        raise HTTPException(400, "At least 1 item is required")

    now = _now()
    item_rows: list[dict] = []
    subtotal = Decimal("0.00")

    for it in payload.items:
        menu = (
            db.query(MenuItem)
            .filter(MenuItem.id == it.menu_item_id)
            .first()
        )
        if not menu:
            raise HTTPException(400, f"Menu item not found: {it.menu_item_id}")

        if not menu.is_active:
            raise HTTPException(400, f"Menu item is disabled: {menu.name}")

        unit_price = _compute_unit_price(db, menu, it)
        line_total = _d2(unit_price * Decimal(int(it.qty)))
        subtotal += line_total

        item_rows.append(
            {
                "menu_id": menu.id,
                "menu_name": menu.name,
                "unit_price": unit_price,
                "qty": it.qty,
                "note": _build_item_note(it),
            }
        )

    subtotal = _d2(subtotal)
    tax = _d2(subtotal * TAX_RATE)
    total = _d2(subtotal + tax)

    order = POSOrder(
        created_by_employee_id=user.id,
        order_type=order_type,
        status=POSOrderStatus.NEW,
        table_no=payload.table_no,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        delivery_address_text=payload.delivery_address_text,
        special_instructions=payload.special_instructions,
        subtotal=subtotal,
        tax=tax,
        total=total,
        created_at=now,
        updated_at=now,
    )

    db.add(order)
    db.flush()  # get order.id before inserting items

    # build items from menu
    for row in item_rows:
        db.add(
            POSOrderItem(
                order_id=order.id,
                menu_item_id=row["menu_id"],
                name_snapshot=row["menu_name"],
                unit_price=row["unit_price"],
                qty=row["qty"],
                note=row["note"],
                is_voided=False,
                created_at=now,
            )
        )

    # initial status log
    db.add(
        POSOrderStatusLog(
            order_id=order.id,
            from_status=None,
            to_status=POSOrderStatus.NEW,
            changed_by_employee_id=user.id,
            changed_at=now,
        )
    )

    db.commit()
    db.refresh(order)
    return order


# -------------------------
# LIST / GET
# -------------------------
@router.get("/orders", response_model=list[OrderRead])
def list_pos_orders(
    status_filter: Optional[str] = Query(default=None, description="e.g. NEW, PREPARING, READY"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    q = db.query(POSOrder)

    if status_filter:
        st = _parse_status(status_filter)
        q = q.filter(POSOrder.status == st)

    orders = (
        q.order_by(POSOrder.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return orders


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_pos_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    return _get_order_or_404(db, order_id)


# -------------------------
# STATUS UPDATE (with audit log)
# -------------------------
@router.patch("/orders/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    order = _get_order_for_update_or_404(db, order_id)
    to_status = _parse_status(payload.to_status)

    if order.status in {POSOrderStatus.CANCELED, POSOrderStatus.VOIDED}:
        raise HTTPException(400, f"Order is already {order.status.name}")

    prev = order.status
    order.status = to_status
    order.updated_at = _now()

    db.add(
        POSOrderStatusLog(
            order_id=order.id,
            from_status=prev,
            to_status=to_status,
            changed_by_employee_id=user.id,
            changed_at=_now(),
        )
    )

    db.commit()
    db.refresh(order)
    return order


# -------------------------
# ADD INSTRUCTION (kitchen notes)
# -------------------------
@router.post("/orders/{order_id}/instructions", response_model=OrderRead)
def add_instruction(
    order_id: int,
    payload: OrderInstructionAdd,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    order = _get_order_for_update_or_404(db, order_id)

    text = (payload.instruction or "").strip()
    if not text:
        raise HTTPException(400, "instruction cannot be empty")

    db.add(
        POSOrderInstruction(
            order_id=order.id,
            instruction=text,
            added_by_employee_id=user.id,
            added_at=_now(),
        )
    )
    order.updated_at = _now()

    db.commit()
    db.refresh(order)
    return order


# -------------------------
# CANCEL ORDER
# -------------------------
@router.post("/orders/{order_id}/cancel", response_model=OrderRead)
def cancel_order(
    order_id: int,
    reason: str = Query(..., min_length=2, max_length=255),
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    order = _get_order_for_update_or_404(db, order_id)

    if order.status in {POSOrderStatus.CANCELED, POSOrderStatus.VOIDED}:
        return order

    prev = order.status
    order.status = POSOrderStatus.CANCELED
    order.canceled_reason = reason
    order.canceled_by_employee_id = user.id
    order.updated_at = _now()

    db.add(
        POSOrderStatusLog(
            order_id=order.id,
            from_status=prev,
            to_status=POSOrderStatus.CANCELED,
            changed_by_employee_id=user.id,
            changed_at=_now(),
        )
    )

    db.commit()
    db.refresh(order)
    return order

# Pricing 

TAX_RATE = Decimal("0.13")  # Canada HST (13%)

@router.post("/orders/quote", response_model=OrderQuoteResponse)
def quote_pos_order(
    payload: OrderQuoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_employee),
):
    if not payload.items:
        raise HTTPException(400, "At least 1 item is required")

    items_out: list[OrderQuoteItem] = []
    subtotal = Decimal("0.00")

    for it in payload.items:
        menu = db.query(MenuItem).filter(MenuItem.id == it.menu_item_id).first()
        if not menu or not menu.is_active:
            raise HTTPException(400, f"Menu item not found/disabled: {it.menu_item_id}")

        unit_price = _compute_unit_price(db, menu, it)
        line_total = _d2(unit_price * Decimal(int(it.qty)))

        subtotal += line_total

        items_out.append(
            OrderQuoteItem(
                menu_item_id=it.menu_item_id,
                qty=it.qty,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    subtotal = _d2(subtotal)
    tax = _d2(subtotal * TAX_RATE)
    total = _d2(subtotal + tax)
    
    return OrderQuoteResponse(subtotal=subtotal, tax=tax, total=total, items=items_out)
