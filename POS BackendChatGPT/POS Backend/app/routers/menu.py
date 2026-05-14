# app/routers/menu.py

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_db, require_roles
from app.models import UserRole
from app.models_pos import POSInventoryItem

router = APIRouter()

_DEFAULT_CRUST_OPTIONS = [
    {"name": "Regular", "description": "Classic hand-tossed crust", "price_adjustment": 0.0, "sort_order": 0},
    {"name": "Thin Crust", "description": "Crispy and light", "price_adjustment": 0.0, "sort_order": 1},
    {"name": "Thick Crust", "description": "Soft and chewy", "price_adjustment": 0.0, "sort_order": 2},
    {"name": "Stuffed Crust", "description": "Cheese-filled outer crust", "price_adjustment": 3.0, "sort_order": 3},
]


def _sync_inventory_for_menu_item(db: Session, menu_item: models.MenuItem) -> None:
    """
    Ensure there is a POSInventoryItem row for this MenuItem.
    SKU is deterministic: MENU-{menu_item.id}
    """
    inv = db.query(POSInventoryItem).filter(POSInventoryItem.menu_item_id == menu_item.id).first()

    if not inv:
        inv = POSInventoryItem(
            sku=f"MENU-{menu_item.id}",
            name=menu_item.name,
            menu_item_id=menu_item.id,
            current_qty=0,
            low_stock_threshold=5,
            is_out_of_stock=True,
            updated_at=datetime.utcnow(),
        )
        db.add(inv)
    else:
        if inv.name != menu_item.name:
            inv.name = menu_item.name
            inv.updated_at = datetime.utcnow()

    db.commit()


def _serialize_menu_item(item: models.MenuItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "image_url": item.image_url,
        "category_id": item.category_id,
        "price_small": item.price_small,
        "price_medium": item.price_medium,
        "price_large": item.price_large,
        "is_popular": item.is_popular,
        "is_spicy": item.is_spicy,
        "is_active": item.is_active,
        "is_deal": item.is_deal,
        "created_at": item.created_at,
        "updated_at": getattr(item, "updated_at", None),
        "category_name": item.category.name if item.category else None,
    }


def _normalize_key(value: Optional[str]) -> str:
    return " ".join((value or "").strip().lower().replace("-", " ").replace("_", " ").split())


def _ensure_default_crust_options(db: Session) -> None:
    count = db.query(models.CrustOption).count()
    if count > 0:
        return
    for row in _DEFAULT_CRUST_OPTIONS:
        db.add(models.CrustOption(**row))
    db.commit()


def _find_crust_or_404(db: Session, crust_id: int) -> models.CrustOption:
    crust = db.get(models.CrustOption, crust_id)
    if not crust:
        raise HTTPException(status_code=404, detail="Crust option not found")
    return crust


def _find_topping_or_404(db: Session, topping_id: int) -> models.Topping:
    topping = db.get(models.Topping, topping_id)
    if not topping:
        raise HTTPException(status_code=404, detail="Topping not found")
    return topping


@router.get("/categories", response_model=List[schemas.CategoryRead])
def list_categories(only_active: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.Category)
    if only_active:
        query = query.filter(models.Category.is_active == True)
    return query.order_by(models.Category.display_order).all()


@router.post("/categories", response_model=schemas.CategoryRead)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    new_cat = models.Category(**category.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


@router.get("/toppings", response_model=List[schemas.ToppingRead])
def list_toppings(
    category: Optional[str] = None,
    only_available: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(models.Topping)
    if only_available:
        query = query.filter(models.Topping.is_available == True)
    if category:
        query = query.filter(func.lower(models.Topping.category) == category.strip().lower())
    return query.order_by(models.Topping.id).all()


@router.post("/toppings", response_model=schemas.ToppingRead)
def create_topping(
    payload: schemas.ToppingCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    topping = models.Topping(**payload.dict())
    db.add(topping)
    db.commit()
    db.refresh(topping)
    return topping


@router.put("/toppings/{topping_id}", response_model=schemas.ToppingRead)
def update_topping(
    topping_id: int,
    payload: schemas.ToppingUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    topping = _find_topping_or_404(db, topping_id)
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(topping, field, value)
    db.commit()
    db.refresh(topping)
    return topping


@router.delete("/toppings/{topping_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_topping(
    topping_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    topping = _find_topping_or_404(db, topping_id)
    topping.is_available = False
    db.commit()
    return None


@router.get("/crust-options", response_model=List[schemas.CrustOptionRead])
def list_crust_options(
    only_available: bool = True,
    db: Session = Depends(get_db),
):
    _ensure_default_crust_options(db)
    query = db.query(models.CrustOption)
    if only_available:
        query = query.filter(models.CrustOption.is_available == True)
    return query.order_by(models.CrustOption.sort_order.asc(), models.CrustOption.id.asc()).all()


@router.post("/crust-options", response_model=schemas.CrustOptionRead)
def create_crust_option(
    payload: schemas.CrustOptionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    normalized = _normalize_key(payload.name)
    if not normalized:
        raise HTTPException(status_code=400, detail="Crust option name is required")

    existing = db.query(models.CrustOption).all()
    if any(_normalize_key(c.name) == normalized for c in existing):
        raise HTTPException(status_code=400, detail="Crust option already exists")

    crust = models.CrustOption(**payload.dict())
    db.add(crust)
    db.commit()
    db.refresh(crust)
    return crust


@router.put("/crust-options/{crust_id}", response_model=schemas.CrustOptionRead)
def update_crust_option(
    crust_id: int,
    payload: schemas.CrustOptionUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    crust = _find_crust_or_404(db, crust_id)
    update_data = payload.dict(exclude_unset=True)

    new_name = update_data.get("name")
    if new_name is not None:
        normalized = _normalize_key(new_name)
        if not normalized:
            raise HTTPException(status_code=400, detail="Crust option name is required")
        existing = db.query(models.CrustOption).filter(models.CrustOption.id != crust_id).all()
        if any(_normalize_key(c.name) == normalized for c in existing):
            raise HTTPException(status_code=400, detail="Crust option already exists")

    for field, value in update_data.items():
        setattr(crust, field, value)
    db.commit()
    db.refresh(crust)
    return crust


@router.delete("/crust-options/{crust_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_crust_option(
    crust_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    crust = _find_crust_or_404(db, crust_id)
    crust.is_available = False
    db.commit()
    return None


@router.get("/", response_model=List[schemas.MenuItemRead])
def list_menu_items(
    category_id: Optional[int] = None,
    only_active: bool = True,
    popular_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(models.MenuItem).join(models.Category)

    if only_active:
        query = query.filter(models.MenuItem.is_active == True)

    if category_id:
        query = query.filter(models.MenuItem.category_id == category_id)

    if popular_only:
        query = query.filter(models.MenuItem.is_popular == True)

    items = query.order_by(models.MenuItem.id).all()
    return [_serialize_menu_item(item) for item in items]


@router.get("/deals", response_model=List[schemas.MenuItemRead])
def list_deal_items(
    only_active: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(models.MenuItem).join(models.Category)

    if only_active:
        query = query.filter(models.MenuItem.is_active == True)

    query = query.filter(models.MenuItem.is_deal == True)
    items = query.order_by(models.MenuItem.id).all()
    return [_serialize_menu_item(item) for item in items]


@router.post("/deals", response_model=schemas.MenuItemRead)
def create_deal_item(
    item: schemas.MenuItemCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    deal_data = item.dict()
    deal_data["is_deal"] = True

    db_item = models.MenuItem(**deal_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    _sync_inventory_for_menu_item(db, db_item)

    return _serialize_menu_item(db_item)


@router.get("/{item_id}", response_model=schemas.MenuItemRead)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.MenuItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return _serialize_menu_item(item)


@router.post("/", response_model=schemas.MenuItemRead)
def create_menu_item(
    item: schemas.MenuItemCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    db_item = models.MenuItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    _sync_inventory_for_menu_item(db, db_item)
    return _serialize_menu_item(db_item)


@router.put("/{item_id}", response_model=schemas.MenuItemRead)
def update_menu_item(
    item_id: int,
    item_update: schemas.MenuItemUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    item = db.get(models.MenuItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    _sync_inventory_for_menu_item(db, item)
    return _serialize_menu_item(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.EMPLOYEE)),
):
    item = db.get(models.MenuItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item.is_active = False
    db.commit()

    inv = db.query(POSInventoryItem).filter(POSInventoryItem.menu_item_id == item_id).first()
    if inv:
        db.delete(inv)
        db.commit()

    return None
