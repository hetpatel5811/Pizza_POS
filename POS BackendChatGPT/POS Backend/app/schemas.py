# app/schemas.py  
# FINAL UPDATED VERSION — FULLY MATCHES models.py

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from app.models import (
    PizzaSize, OrderStatus, OrderType,
    PaymentMethod, PaymentStatus, UserRole
)

# -------------------------------------------------
# CATEGORY
# -------------------------------------------------

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0
    image_url: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# -------------------------------------------------
# TOPPING
# -------------------------------------------------

class ToppingBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    category: Optional[str] = None
    is_vegetarian: bool = True
    is_available: bool = True

class ToppingCreate(ToppingBase):
    pass

class ToppingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_vegetarian: Optional[bool] = None
    is_available: Optional[bool] = None

class ToppingRead(ToppingBase):
    id: int

    class Config:
        from_attributes = True

# -------------------------------------------------
# CRUST OPTIONS
# -------------------------------------------------

class CrustOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_adjustment: float = 0.0
    sort_order: int = 0
    is_available: bool = True

class CrustOptionCreate(CrustOptionBase):
    pass

class CrustOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_adjustment: Optional[float] = None
    sort_order: Optional[int] = None
    is_available: Optional[bool] = None

class CrustOptionRead(CrustOptionBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -------------------------------------------------
# MENU ITEM (MATCHES SQLAlchemy MODEL)
# -------------------------------------------------

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

    category_id: int

    price_small: Optional[float] = None
    price_medium: Optional[float] = None
    price_large: Optional[float] = None

    is_popular: bool = False
    is_spicy: bool = False
    is_active: bool = True

    is_deal: bool = False


class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

    price_small: Optional[float] = None
    price_medium: Optional[float] = None
    price_large: Optional[float] = None

    is_popular: Optional[bool] = None
    is_spicy: Optional[bool] = None
    is_active: Optional[bool] = None

    is_deal: Optional[bool] = None

class MenuItemRead(MenuItemBase):
    id: int
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -------------------------------------------------
# CART / ORDER
# -------------------------------------------------

class CartTopping(BaseModel):
    topping_id: int
    quantity: int = 1

class CartItem(BaseModel):
    menu_item_id: int
    size: PizzaSize
    quantity: int = 1
    crust: Optional[str] = None
    crust_option_id: Optional[int] = None
    sauce: Optional[str] = None
    extra_cheese: bool = False
    extra_sauce: bool = False
    special_instructions: Optional[str] = None
    toppings: List[CartTopping] = []

class CalculateCartRequest(BaseModel):
    cart_items: List[CartItem]
    order_type: OrderType
    delivery_zip: Optional[str] = None

class CalculateCartResponse(BaseModel):
    subtotal: float
    tax: float
    delivery_fee: float
    total: float
    items_detail: List[Dict[str, Any]] = []
    tax_rate: float = 0.13
    minimum_order: Optional[float] = None
    delivery_available: bool = True

class OrderItemToppingRead(BaseModel):
    topping: ToppingRead
    quantity: int

    class Config:
        from_attributes = True

class OrderItemRead(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: str
    size: PizzaSize
    quantity: int
    crust: Optional[str]
    sauce: Optional[str]
    extra_cheese: bool
    extra_sauce: bool
    special_instructions: Optional[str]
    unit_price: float
    total_price: float
    toppings: List[OrderItemToppingRead] = []

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: str
    order_type: OrderType = OrderType.DELIVERY
    delivery_address: Optional[str] = None
    delivery_instructions: Optional[str] = None
    table_number: Optional[str] = None
    notes: Optional[str] = None
    delivery_zip: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH

class OrderCreate(OrderBase):
    cart_items: List[CartItem]

class OrderRead(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: float
    tax: float
    delivery_fee: float
    discount: float
    total: float
    estimated_delivery_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True

class AppConfig(BaseModel):
    tax_rate: float = 0.13
    default_delivery_fee: float = 2.99
    min_delivery_amount: float = 15.00
    currency: str = "USD"
    available_payment_methods: List[str] = ["cash"]
    available_order_types: List[str] = ["delivery", "pickup", "dine_in"]

class PaymentIntentRequest(BaseModel):
    order_id: int
    amount: float
    currency: str = "usd"

class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: float
    currency: str

class PaymentConfirmRequest(BaseModel):
    order_id: int
    payment_intent_id: str

class PaymentResponse(BaseModel):
    status: str
    payment_intent_id: Optional[str] = None
    receipt_url: Optional[str] = None
    reference: Optional[str] = None
    message: str

class PaymentRequest(BaseModel):
    card_number: str

# -----------------------------
# AUTH SCHEMAS
# -----------------------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: UserRole  # employee/admin

class UpdateUserRole(BaseModel):
    role: UserRole

# -----------------------------
# ADDRESS SCHEMAS
# -----------------------------

class AddressBase(BaseModel):
    address_type: str
    label: Optional[str] = None
    full_name: str
    street: str
    apartment: Optional[str] = None
    city: str
    province: Optional[str] = None
    postal_code: str
    phone_number: str
    instructions: Optional[str] = None

class AddressCreate(AddressBase):
    pass

class AddressRead(AddressBase):
    id: int
    is_default: bool

    class Config:
        from_attributes = True

# -------------------------------
# SIMPLE CART (CART SIDEBAR ONLY)
# -------------------------------

class SimpleCartItem(BaseModel):
    price: float
    quantity: int

class SimpleCartCalculateRequest(BaseModel):
    items: List[SimpleCartItem]

class SimpleCartCalculateResponse(BaseModel):
    subtotal: float
    tax: float
    total: float
    tax_rate: float = 0.13

# -------------------------------
# Employee Productivity
# -------------------------------

class ProductivityStartResponse(BaseModel):
    session_id: int
    started_at: datetime

class ProductivityActiveResponse(BaseModel):
    active: bool
    session_id: Optional[int] = None
    started_at: Optional[datetime] = None
    elapsed_seconds: Optional[int] = None

class ProductivityStopResponse(BaseModel):
    ok: bool
    total_seconds: int
