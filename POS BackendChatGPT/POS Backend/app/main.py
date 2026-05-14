# main.py (UPDATED)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import menu, orders, payments, cart, config, auth, addresses, employee_panel, inventory, pos_orders, favorites
from app.config import settings

import app.models_pos  

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Pizza POS Backend API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(addresses.router, prefix="/api/addresses", tags=["addresses"])
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(config.router, prefix="/api/config", tags=["config"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])

# Employee panel
app.include_router(employee_panel.router, prefix="/api/employee", tags=["employee"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(pos_orders.router, prefix="/api/employee", tags=["employee-orders"])

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
