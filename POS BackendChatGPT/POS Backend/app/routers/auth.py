from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from typing import Annotated
from app.schemas import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserRead,
    AdminUserCreate,
    UpdateUserRole,
    UserProfileUpdate,
)
from app.models import User, UserRole
from app.deps import get_db, get_current_user, require_roles
from app.config import settings

router = APIRouter()
pwd = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT SETTINGS (same as deps.py)
SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM


@router.post("/bootstrap-admin", response_model=UserRead)
def bootstrap_admin(
    payload: UserCreate,
    db: Session = Depends(get_db),
    x_bootstrap_key: Annotated[str | None, Header(alias="X-BOOTSTRAP-KEY")] = None,
):
    if not x_bootstrap_key or x_bootstrap_key != settings.BOOTSTRAP_ADMIN_KEY:
        raise HTTPException(403, "Invalid bootstrap key")

    # 2) Allow only if no admin exists
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
    if existing_admin:
        raise HTTPException(403, "Admin already exists")

    # 3) Validate passwords
    if payload.password != payload.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    # 4) Email uniqueness
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    hashed = pwd.hash(payload.password[:72])

    admin = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hashed,
        role=UserRole.ADMIN.value,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return UserRead(
        id=admin.id,
        name=admin.name,
        email=admin.email,
        phone=admin.phone,
        role=admin.role,
    )


def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(days=3)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=TokenResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Password match
    if payload.password != payload.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    # Email uniqueness check
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    # Hash password
    hashed = pwd.hash(payload.password[:72])

    # Create user
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hashed,
        role=UserRole.CUSTOMER.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-generate JWT token
    token = create_token({"user_id": user.id})

    return TokenResponse(
        access_token=token,
        user=UserRead(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
        )
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not pwd.verify(payload.password, user.password_hash):
        raise HTTPException(400, "Invalid email or password")

    token = create_token({"user_id": user.id})

    return TokenResponse(
        access_token=token,
        user=UserRead(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
        )
    )

@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return UserRead(
        id=user.id, name=user.name, email=user.email, phone=user.phone, role=user.role
    )


@router.patch("/me", response_model=UserRead)
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    updates = payload.dict(exclude_unset=True)
    if not updates:
        return UserRead(
            id=user.id, name=user.name, email=user.email, phone=user.phone, role=user.role
        )

    if "email" in updates:
        next_email = str(updates["email"]).strip().lower()
        existing = db.query(User).filter(User.email == next_email, User.id != user.id).first()
        if existing:
            raise HTTPException(400, "Email already registered")
        user.email = next_email

    if "name" in updates:
        next_name = str(updates["name"]).strip()
        if not next_name:
            raise HTTPException(400, "Name cannot be empty")
        user.name = next_name

    if "phone" in updates:
        next_phone = str(updates["phone"]).strip()
        if not next_phone:
            raise HTTPException(400, "Phone cannot be empty")
        user.phone = next_phone

    db.commit()
    db.refresh(user)
    return UserRead(
        id=user.id, name=user.name, email=user.email, phone=user.phone, role=user.role
    )

@router.post("/users", response_model=UserRead)
def admin_create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    hashed = pwd.hash(payload.password[:72])

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hashed,
        role=payload.role.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserRead(
        id=user.id, name=user.name, email=user.email, phone=user.phone, role=user.role
    )

@router.patch("/users/{user_id}/role", response_model=UserRead)
def admin_update_role(
    user_id: int,
    payload: UpdateUserRole,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.role = payload.role.value
    db.commit()
    db.refresh(user)

    return UserRead(
        id=user.id, name=user.name, email=user.email, phone=user.phone, role=user.role
    )
