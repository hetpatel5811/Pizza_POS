from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_current_user, get_db

router = APIRouter(tags=["favorites"])


def _normalize_name(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def _find_existing_favorite(
    db: Session,
    user_id: int,
    payload: schemas.FavoritePizzaCreate,
) -> models.UserFavoritePizza | None:
    q = db.query(models.UserFavoritePizza).filter(models.UserFavoritePizza.user_id == user_id)

    if payload.menu_item_id is not None:
        return q.filter(models.UserFavoritePizza.menu_item_id == payload.menu_item_id).first()

    normalized = _normalize_name(payload.name)
    return q.filter(func.lower(models.UserFavoritePizza.name) == normalized).first()


def _validate_menu_item(db: Session, menu_item_id: int | None) -> None:
    if menu_item_id is None:
        return
    exists = db.query(models.MenuItem.id).filter(models.MenuItem.id == menu_item_id).first()
    if not exists:
        raise HTTPException(status_code=400, detail="Invalid menu_item_id")


@router.get("/me", response_model=list[schemas.FavoritePizzaRead])
def list_my_favorites(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.UserFavoritePizza)
        .filter(models.UserFavoritePizza.user_id == user.id)
        .order_by(models.UserFavoritePizza.created_at.desc())
        .all()
    )


@router.post("/me", response_model=schemas.FavoritePizzaRead, status_code=status.HTTP_201_CREATED)
def add_or_update_favorite(
    payload: schemas.FavoritePizzaCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _validate_menu_item(db, payload.menu_item_id)
    existing = _find_existing_favorite(db, user.id, payload)

    if existing:
        existing.name = payload.name
        existing.description = payload.description
        existing.image_url = payload.image_url
        existing.price = payload.price
        existing.rating = payload.rating
        existing.default_size = payload.default_size
        existing.default_crust = payload.default_crust
        existing.extras = payload.extras or []
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    favorite = models.UserFavoritePizza(
        user_id=user.id,
        menu_item_id=payload.menu_item_id,
        name=payload.name,
        description=payload.description,
        image_url=payload.image_url,
        price=payload.price,
        rating=payload.rating,
        default_size=payload.default_size,
        default_crust=payload.default_crust,
        extras=payload.extras or [],
    )

    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


@router.patch("/me/{favorite_id}", response_model=schemas.FavoritePizzaRead)
def update_favorite(
    favorite_id: int,
    payload: schemas.FavoritePizzaUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    favorite = (
        db.query(models.UserFavoritePizza)
        .filter(models.UserFavoritePizza.id == favorite_id, models.UserFavoritePizza.user_id == user.id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    updates = payload.dict(exclude_unset=True)
    if "menu_item_id" in updates:
        _validate_menu_item(db, updates.get("menu_item_id"))

    for field, value in updates.items():
        setattr(favorite, field, value)

    favorite.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(favorite)
    return favorite


@router.delete("/me/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    favorite = (
        db.query(models.UserFavoritePizza)
        .filter(models.UserFavoritePizza.id == favorite_id, models.UserFavoritePizza.user_id == user.id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()
    return None
