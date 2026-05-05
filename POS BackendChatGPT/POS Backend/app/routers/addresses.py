from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import UserAddress
from app.schemas import AddressCreate, AddressRead
from app.deps import get_db, get_current_user

router = APIRouter()


@router.get("/me", response_model=list[AddressRead])
def get_user_addresses(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return (
        db.query(UserAddress)
        .filter(UserAddress.user_id == user.id)
        .all()
    )


@router.post("/", response_model=AddressRead)
def add_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if payload.address_type.lower() in ["home", "work", "hostel"]:
        existing = db.query(UserAddress).filter(
            UserAddress.user_id == user.id,
            UserAddress.address_type.ilike(payload.address_type)
        ).first()

        if existing:
            existing.label = payload.label
            existing.full_name = payload.full_name
            existing.street = payload.street
            existing.apartment = payload.apartment
            existing.city = payload.city
            existing.province = payload.province
            existing.postal_code = payload.postal_code
            existing.phone_number = payload.phone_number
            existing.instructions = payload.instructions
            db.commit()
            db.refresh(existing)
            return existing

    new_addr = UserAddress(
        user_id=user.id,
        address_type=payload.address_type,
        label=payload.label,
        full_name=payload.full_name,
        street=payload.street,
        apartment=payload.apartment,
        city=payload.city,
        province=payload.province,
        postal_code=payload.postal_code,
        phone_number=payload.phone_number,
        instructions=payload.instructions,
        is_default=False,
    )

    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)

    return new_addr


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    addr = db.query(UserAddress).filter(
        UserAddress.id == address_id,
        UserAddress.user_id == user.id
    ).first()

    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    db.delete(addr)
    db.commit()

    return {"message": "Address deleted"}
