from datetime import datetime
import enum
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, Text, ForeignKey, Index, Enum as SqlEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# ─────────────────────────────
# ENUMS
# ─────────────────────────────

def pg_enum(enum_cls, name: str):
    return SqlEnum(
        enum_cls,
        name=name,  # IMPORTANT: must match your existing Postgres enum type name
        values_callable=lambda x: [e.value for e in x],  # store "pickup" not "PICKUP"
        native_enum=True,
        validate_strings=True,
    )

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    EMPLOYEE = "employee"
    ADMIN = "admin"

class PizzaSize(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    XLARGE = "xlarge"

class CrustType(str, enum.Enum):
    REGULAR = "regular"
    THIN = "thin"
    STUFFED = "stuffed"
    DEEP_DISH = "deep_dish"

class SauceType(str, enum.Enum):
    TOMATO = "tomato"
    BBQ = "bbq"
    GARLIC = "garlic"
    WHITE = "white"
    SPICY = "spicy"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    BAKING = "baking"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderType(str, enum.Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"
    DINE_IN = "dine_in"

class PaymentMethod(str, enum.Enum):
    CARD = "card"
    CASH = "cash"
    ONLINE = "online"
    WALLET = "wallet"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

# ─────────────────────────────
# CATEGORIES
# ─────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    menu_items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

# ─────────────────────────────
# TOPPINGS
# ─────────────────────────────

class Topping(Base):
    __tablename__ = "toppings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    category = Column(String(50))
    is_vegetarian = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# CRUST OPTIONS (DYNAMIC FOR CUSTOMER CUSTOMIZER)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class CrustOption(Base):
    __tablename__ = "crust_options"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price_adjustment = Column(Float, default=0.0)
    sort_order = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ─────────────────────────────
# MENU ITEM
# ─────────────────────────────

class MenuItem(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    price_small = Column(Float)
    price_medium = Column(Float)
    price_large = Column(Float)

    image_url = Column(String(500))

    is_popular = Column(Boolean, default=False)
    is_spicy = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # ⭐ NEW FIELD FOR DEAL ITEMS
    is_deal = Column(Boolean, default=False)

    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="menu_items")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order_items = relationship("OrderItem", back_populates="menu_item")

# ─────────────────────────────
# DELIVERY AREA
# ─────────────────────────────

class DeliveryArea(Base):
    __tablename__ = "delivery_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    zip_codes = Column(Text, nullable=False)
    delivery_fee = Column(Float, default=2.99)
    min_order_amount = Column(Float, default=15.00)
    estimated_delivery_time = Column(Integer, default=45)
    is_active = Column(Boolean, default=True)

# ─────────────────────────────
# ORDER
# ─────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_number = Column(String(50), unique=True)

    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100))
    customer_phone = Column(String(20), nullable=False)

    order_type = Column(pg_enum(OrderType, "ordertype"), nullable=False)
    delivery_address = Column(Text)
    delivery_instructions = Column(Text)
    table_number = Column(String(20))
    notes = Column(Text)
    delivery_zip = Column(String(20))

    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    status = Column(pg_enum(OrderStatus, "orderstatus"), default=OrderStatus.PENDING)
    payment_method = Column(pg_enum(PaymentMethod, "paymentmethod"), default=PaymentMethod.CASH)
    payment_status = Column(pg_enum(PaymentStatus, "paymentstatus"), default=PaymentStatus.PENDING)
    estimated_delivery_time = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

# ─────────────────────────────
# ORDER ITEM (FIXED)
# ─────────────────────────────

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)

    # FIXED FOREIGN KEY
    menu_item_id = Column(Integer, ForeignKey("menu.id"), nullable=False)

    menu_item_name = Column(String(200), nullable=False)

    size = Column(pg_enum(PizzaSize, "pizzasize"), nullable=False)
    crust = Column(String(50))
    sauce = Column(String(50))
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    extra_cheese = Column(Boolean, default=False)
    extra_sauce = Column(Boolean, default=False)
    special_instructions = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

    toppings = relationship("OrderItemTopping", back_populates="order_item", cascade="all, delete-orphan")

class OrderItemTopping(Base):
    __tablename__ = "order_item_toppings"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"))
    topping_id = Column(Integer, ForeignKey("toppings.id"))
    quantity = Column(Integer, default=1)

    order_item = relationship("OrderItem", back_populates="toppings")
    topping = relationship("Topping")

# -----------------------------
# USER & ADDRESS MODELS
# -----------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)

    # NEW
    role = Column(String(20), nullable=False, default=UserRole.CUSTOMER.value, index=True)
    employee_sessions = relationship(
        "EmployeeSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete")

class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    address_type = Column(String(50), nullable=False)  # Home, Office, etc.
    label = Column(String(100), nullable=True)
    full_name = Column(String(100), nullable=False)
    street = Column(String(200), nullable=False)
    apartment = Column(String(200), nullable=True)
    city = Column(String(100), nullable=False)
    province = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=False)
    phone_number = Column(String(30), nullable=False)
    instructions = Column(String(255), nullable=True)
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")

class EmployeeSession(Base):
    __tablename__ = "employee_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # optional, useful for inactivity detection
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="employee_sessions")

# Index to speed up "find active session"
Index("ix_employee_sessions_user_active", EmployeeSession.user_id, EmployeeSession.ended_at)
