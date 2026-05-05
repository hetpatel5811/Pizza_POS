# app/config.py

from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "Pizza POS"

    DATABASE_URL: str

    # JWT CONFIG
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    BOOTSTRAP_ADMIN_KEY: str = "change-this-to-a-long-secret"

    # Stripe (optional)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    ENABLE_DEMO_PAYMENTS: bool = False

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
