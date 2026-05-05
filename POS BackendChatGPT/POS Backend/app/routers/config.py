# app/routers/config.py

from fastapi import APIRouter
from app.schemas import AppConfig

router = APIRouter()

@router.get("/", response_model=AppConfig)
def get_config():
    return AppConfig()