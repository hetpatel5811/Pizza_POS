# app/deps.py
from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.database import SessionLocal
from app.models import User, UserRole
from app.config import settings

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(401, "Authorization header missing")

    token = creds.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(401, "Invalid token")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(404, "User not found")

        return user

    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

def require_roles(*allowed: UserRole):
    def _check(user: User = Depends(get_current_user)):
        if user.role not in {r.value for r in allowed}:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user
    return _check
