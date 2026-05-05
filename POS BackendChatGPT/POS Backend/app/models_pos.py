# app/models_pos.py
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    ForeignKey,
    Boolean,
    Numeric,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def pg_enum_values(enum_cls, name: str):
    return Enum(
        enum_cls,
        name=name,
        values_callable=lambda members: [m.value for m in members],
        native_enum=True,
        validate_strings=True,
    )


# ---------- Enums ----------
class ClockEventType(str, enum.Enum):
    CLOCK_IN = "CLOCK_IN"
    BREAK_START = "BREAK_START"
    BREAK_END = "BREAK_END"
    CLOCK_OUT = "CLOCK_OUT"


class OrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"
    DELIVERY = "DELIVERY"


class OrderStatus(str, enum.Enum):
    NEW = "NEW"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELED = "CANCELED"
    VOIDED = "VOIDED"


class VoidRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    UPI = "UPI"
    OTHER = "OTHER"


class PaymentStatus(str, enum.Enum):
    PAID = "PAID"
    VOIDED = "VOIDED"
    REFUNDED = "REFUNDED"


# ---------- Time clock ----------
class TimeClockEvent(Base):
    __tablename__ = "time_clock_events"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(Enum(ClockEventType), nullable=False)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    note = Column(String(255), nullable=True)

    employee = relationship("User")

    __table_args__ = (
        Index("ix_time_clock_employee_time", "employee_id", "occurred_at"),
    )


class POSShiftSchedule(Base):
    """
    Simple schedule table (today’s schedule comes from here).
    You can load shifts weekly/monthly.
    """
    __tablename__ = "pos_shift_schedule"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    start_dt = Column(DateTime, nullable=False)
    end_dt = Column(DateTime, nullable=False)

    role_label = Column(String(50), nullable=True)  # e.g., "Cashier", "Kitchen"
    note = Column(String(255), nullable=True)

    employee = relationship("User")

    __table_args__ = (
        Index("ix_shift_employee_start", "employee_id", "start_dt"),
    )


# ---------- Orders ----------
class POSOrder(Base):
    __tablename__ = "pos_orders"

    id = Column(Integer, primary_key=True, index=True)

    created_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    order_type = Column(pg_enum_values(OrderType, "posordertype"), nullable=False)
    status = Column(pg_enum_values(OrderStatus, "posorderstatus"), default=OrderStatus.NEW.value, nullable=False)

    table_no = Column(String(20), nullable=True)  # dine-in
    customer_name = Column(String(120), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    delivery_address_text = Column(Text, nullable=True)  # delivery

    special_instructions = Column(Text, nullable=True)

    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    tax = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    canceled_reason = Column(String(255), nullable=True)
    canceled_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_employee_id])
    canceled_by = relationship("User", foreign_keys=[canceled_by_employee_id])

    items = relationship("POSOrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("POSPayment", back_populates="order", cascade="all, delete-orphan")
    status_logs = relationship("POSOrderStatusLog", back_populates="order", cascade="all, delete-orphan")
    instructions = relationship("POSOrderInstruction", back_populates="order", cascade="all, delete-orphan")


class POSOrderItem(Base):
    __tablename__ = "pos_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False)

    # If you already have menu items table, store menu_item_id; keep snapshot too.
    menu_item_id = Column(Integer, nullable=True)

    name_snapshot = Column(String(160), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    qty = Column(Integer, nullable=False, default=1)

    note = Column(String(255), nullable=True)
    is_voided = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("POSOrder", back_populates="items")


class POSOrderStatusLog(Base):
    __tablename__ = "pos_order_status_log"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False)

    from_status = Column(pg_enum_values(OrderStatus, "posorderstatus"), nullable=True)
    to_status = Column(pg_enum_values(OrderStatus, "posorderstatus"), nullable=False)

    changed_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("POSOrder", back_populates="status_logs")
    changed_by = relationship("User")


class POSOrderInstruction(Base):
    __tablename__ = "pos_order_instructions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False)

    instruction = Column(Text, nullable=False)
    added_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("POSOrder", back_populates="instructions")
    added_by = relationship("User")


# ---------- Void / manager approval ----------
class POSVoidRequest(Base):
    __tablename__ = "pos_void_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False)

    requested_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(255), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    status = Column(Enum(VoidRequestStatus), default=VoidRequestStatus.PENDING, nullable=False)

    decided_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decision_note = Column(String(255), nullable=True)

    order = relationship("POSOrder")
    requested_by = relationship("User", foreign_keys=[requested_by_employee_id])
    decided_by = relationship("User", foreign_keys=[decided_by_employee_id])

    __table_args__ = (
        UniqueConstraint("order_id", "status", name="uq_void_pending_per_order"),
    )


# ---------- Payments + receipts ----------
class POSPayment(Base):
    __tablename__ = "pos_payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False)

    method = Column(pg_enum_values(PaymentMethod, "pospaymentmethod"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    status = Column(pg_enum_values(PaymentStatus, "pospaymentstatus"), default=PaymentStatus.PAID.value, nullable=False)

    receipt_no = Column(String(40), nullable=False, unique=True)
    paid_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    taken_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    taken_by = relationship("User")

    order = relationship("POSOrder", back_populates="payments")


# ---------- Inventory (out-of-stock / low stock) ----------
class POSInventoryItem(Base):
    __tablename__ = "pos_inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(60), nullable=True, unique=True)
    name = Column(String(160), nullable=False)

    # Optional link to menu item if you have it
    menu_item_id = Column(Integer, nullable=True)

    current_qty = Column(Numeric(12, 2), default=0, nullable=False)
    low_stock_threshold = Column(Numeric(12, 2), default=0, nullable=False)

    is_out_of_stock = Column(Boolean, default=False, nullable=False)

    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class POSStockEvent(Base):
    __tablename__ = "pos_stock_events"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("pos_inventory_items.id", ondelete="CASCADE"), nullable=False)

    change_qty = Column(Numeric(12, 2), nullable=False)  # +/- change
    reason = Column(String(255), nullable=False)

    changed_by_employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    item = relationship("POSInventoryItem")
    changed_by = relationship("User")
