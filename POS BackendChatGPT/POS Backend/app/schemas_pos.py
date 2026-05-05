from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal  
from pydantic import BaseModel, Field


class ClockEventCreate(BaseModel):
    note: Optional[str] = None

class ClockEventRead(BaseModel):
    id: int
    employee_id: int
    event_type: str
    occurred_at: datetime
    note: Optional[str] = None

    class Config:
        from_attributes = True

class ShiftScheduleCreate(BaseModel):
    employee_id: int
    start_dt: datetime
    end_dt: datetime
    role_label: Optional[str] = None
    note: Optional[str] = None

class ShiftScheduleRead(BaseModel):
    id: int
    employee_id: int
    start_dt: datetime
    end_dt: datetime
    role_label: Optional[str] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True

class ClockStatusRead(BaseModel):
    state: str  # OFF_DUTY / ON_SHIFT / ON_BREAK
    last_event_at: Optional[datetime] = None
    shift_seconds_worked: int = 0
    break_seconds: int = 0
    shift_started_at: Optional[datetime] = None
    on_break_started_at: Optional[datetime] = None
    today_schedule: List[ShiftScheduleRead] = []

class EmployeeWorkDailyRead(BaseModel):
    employee_id: int
    employee_name: str
    role: str
    date: str
    worked_seconds: int
    break_seconds: int
    worked_hms: str
    break_hms: str

# ---------- Orders ----------
class OrderItemCreate(BaseModel):
    menu_item_id: Optional[int] = None
    name: str
    unit_price: Decimal
    qty: int = Field(ge=1, le=999)
    note: Optional[str] = None

class OrderCreate(BaseModel):
    order_type: Literal["DINE_IN", "TAKEAWAY"]  # ✅ only these two
    table_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    # keep delivery_address_text if you want backward compatibility, but it won't be used
    delivery_address_text: Optional[str] = None
    special_instructions: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemRead(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    name_snapshot: str
    unit_price: Decimal
    qty: int
    note: Optional[str] = None
    is_voided: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OrderRead(BaseModel):
    id: int
    order_type: str
    status: str
    table_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address_text: Optional[str] = None
    special_instructions: Optional[str] = None
    subtotal: Decimal = 0
    tax: Decimal = 0
    total: Decimal = 0
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    to_status: str  # NEW / PREPARING / READY / COMPLETED
    note: Optional[str] = None

class OrderInstructionAdd(BaseModel):
    instruction: str

# ---------- Void / cancel ----------
class VoidRequestCreate(BaseModel):
    reason: str

class VoidRequestRead(BaseModel):
    id: int
    order_id: int
    requested_by_employee_id: Optional[int] = None
    reason: str
    requested_at: datetime
    status: str
    decided_by_employee_id: Optional[int] = None
    decided_at: Optional[datetime] = None
    decision_note: Optional[str] = None

    class Config:
        from_attributes = True

class VoidDecision(BaseModel):
    decision_note: Optional[str] = None

# ---------- Payments / receipts ----------
class PaymentCreate(BaseModel):
    method: str  # CASH/CARD/UPI/OTHER
    amount: Decimal
    currency: str = "USD"

class PaymentRead(BaseModel):
    id: int
    order_id: int
    method: str
    amount: Decimal
    currency: str
    status: str
    receipt_no: str
    paid_at: datetime

    class Config:
        from_attributes = True

class ReceiptRead(BaseModel):
    receipt_no: str
    order_id: int
    paid_at: datetime
    amount: Decimal
    currency: str
    method: str
    order_snapshot: OrderRead

# ---------- Inventory ----------
class InventoryItemCreate(BaseModel):
    sku: Optional[str] = None
    name: str
    menu_item_id: Optional[int] = None
    current_qty: Decimal = 0
    low_stock_threshold: Decimal = 0
    is_out_of_stock: bool = False

class InventoryItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    menu_item_id: Optional[int] = None
    current_qty: Optional[Decimal] = None
    low_stock_threshold: Optional[Decimal] = None
    is_out_of_stock: Optional[bool] = None

class InventoryItemRead(BaseModel):
    id: int
    sku: Optional[str] = None
    name: str
    menu_item_id: Optional[int] = None
    current_qty: Decimal
    low_stock_threshold: Decimal
    is_out_of_stock: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class StockAdjust(BaseModel):
    change_qty: Decimal
    reason: str

class POSCartTopping(BaseModel):
    topping_id: int
    quantity: int = Field(default=1, ge=1, le=20)

class OrderItemCreate(BaseModel):
    menu_item_id: int

    # optional customization (similar to customer order)
    size: Optional[str] = None            # "small" | "medium" | "large"
    crust: Optional[str] = None
    crust_option_id: Optional[int] = None
    sauce: Optional[str] = None
    extra_cheese: bool = False
    extra_sauce: bool = False
    special_instructions: Optional[str] = None
    toppings: List[POSCartTopping] = []

    qty: int = Field(ge=1, le=999)
    unit_price: Optional[Decimal] = None

class OrderCreate(BaseModel):
    order_type: str  # DINE_IN / TAKEAWAY / DELIVERY
    table_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address_text: Optional[str] = None
    special_instructions: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemRead(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    name_snapshot: str
    unit_price: Decimal
    qty: int
    note: Optional[str] = None
    is_voided: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OrderRead(BaseModel):
    id: int
    order_type: str
    status: str
    table_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address_text: Optional[str] = None
    special_instructions: Optional[str] = None
    subtotal: Decimal = 0
    tax: Decimal = 0
    total: Decimal = 0
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    to_status: str  
    note: Optional[str] = None

class OrderInstructionAdd(BaseModel):
    instruction: str

class OrderQuoteItem(BaseModel):
    menu_item_id: int
    qty: int
    unit_price: Decimal
    line_total: Decimal

class OrderQuoteRequest(BaseModel):
    items: List[OrderItemCreate]

class OrderQuoteResponse(BaseModel):
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    items: List[OrderQuoteItem]
