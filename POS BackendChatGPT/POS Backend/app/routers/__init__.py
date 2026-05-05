# app/routers/__init__.py

from .menu import router as menu_router
from .orders import router as orders_router
from .cart import router as cart_router
from .config import router as config_router
from . import auth, addresses, menu, orders, payments, cart, config
from . import employee_panel, inventory

__all__ = ["menu_router", "orders_router", "cart_router", "config_router"]