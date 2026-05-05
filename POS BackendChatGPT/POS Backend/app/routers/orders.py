from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(tags=["orders"])
TAX_RATE = 0.13

EMPLOYEE_ROLES = {"admin", "manager", "employee", "cashier", "kitchen", "staff"}
LEGACY_CRUST_UPCHARGE = {
    "stuffed crust": 3.0,
    "stuffed": 3.0,
    "stuffed_crust": 3.0,
}


def _role(user: models.User) -> str:
    return str(getattr(user, "role", "") or "").strip().lower()


def require_employee(user: models.User = Depends(get_current_user)) -> models.User:
    if _role(user) not in EMPLOYEE_ROLES:
        raise HTTPException(status_code=403, detail="Employee access required")
    return user


def _normalize_key(value: str | None) -> str:
    return " ".join((value or "").strip().lower().replace("-", " ").replace("_", " ").split())


def _crust_price_adjustment(
    db: Session,
    crust: str | None,
    crust_option_id: int | None = None,
) -> float:
    if crust_option_id is not None:
        selected = db.get(models.CrustOption, crust_option_id)
        if not selected or not selected.is_available:
            raise HTTPException(status_code=400, detail="Invalid crust option")
        return float(selected.price_adjustment or 0.0)

    key = _normalize_key(crust)
    if not key:
        return 0.0

    options = db.query(models.CrustOption).all()
    for option in options:
        if _normalize_key(option.name) == key:
            if not option.is_available:
                raise HTTPException(status_code=400, detail="Selected crust option is unavailable")
            return float(option.price_adjustment or 0.0)

    return LEGACY_CRUST_UPCHARGE.get(key, 0.0)


def _get_order_or_404(db: Session, order_number: str) -> models.Order:
    order = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _get_order_for_update_or_404(db: Session, order_number: str) -> models.Order:
    order = (
        db.query(models.Order)
        .filter(models.Order.order_number == order_number)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _generate_order_number(db: Session) -> str:
    """
    Generates a dynamic order ID with timestamp + random suffix.
    Example: ORD2605051545018F3A9C1D
    """
    for _ in range(10):
        candidate = f"ORD{datetime.utcnow().strftime('%y%m%d%H%M%S')}{secrets.token_hex(4).upper()}"
        exists = db.query(models.Order.id).filter(models.Order.order_number == candidate).first()
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Unable to generate order number")


def _is_order_number_conflict(exc: IntegrityError) -> bool:
    msg = str(getattr(exc, "orig", exc)).lower()
    return "order_number" in msg and "unique" in msg


def _persist_order_with_retry(db: Session, order: models.Order, attempts: int = 3) -> models.Order:
    for attempt in range(attempts):
        try:
            db.add(order)
            db.commit()
            db.refresh(order)
            return order
        except IntegrityError as exc:
            db.rollback()
            if _is_order_number_conflict(exc) and attempt < attempts - 1:
                order.order_number = _generate_order_number(db)
                continue
            raise HTTPException(status_code=409, detail="Could not create order. Please try again.") from exc

    raise HTTPException(status_code=500, detail="Unable to create order at this time")


@router.get("", response_model=list[schemas.OrderRead])
def list_orders(
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_employee),
):
    q = db.query(models.Order)

    if status_filter:
        raw = status_filter.strip().lower()
        try:
            status_value = models.OrderStatus(raw)
        except ValueError:
            allowed = ", ".join(s.value for s in models.OrderStatus)
            raise HTTPException(status_code=400, detail=f"Invalid status_filter. Allowed: {allowed}")
        q = q.filter(models.Order.status == status_value)

    orders = (
        q.order_by(models.Order.created_at.desc())
        .offset(max(0, offset))
        .limit(min(max(1, limit), 200))
        .all()
    )
    return orders

@router.get("/{order_number}", response_model=schemas.OrderRead)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(
        models.Order.order_number == order_number
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order

@router.post(
    "",
    response_model=schemas.OrderRead,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Handles DELIVERY, PICKUP, DINE_IN orders
    """

    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # VALIDATE ORDER TYPE
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if order_data.order_type == models.OrderType.DELIVERY:
        if not order_data.delivery_address or not order_data.delivery_zip:
            raise HTTPException(
                status_code=400,
                detail="Delivery address and zip are required"
            )

    elif order_data.order_type == models.OrderType.PICKUP:
        order_data.delivery_address = None
        order_data.delivery_zip = None
        order_data.table_number = None

    elif order_data.order_type == models.OrderType.DINE_IN:
        if not order_data.table_number:
            raise HTTPException(
                status_code=400,
                detail="Table number is required for dine-in"
            )
        order_data.delivery_address = None
        order_data.delivery_zip = None

    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # BUILD ORDER ITEMS + SUBTOTAL
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    subtotal = 0.0
    order_items = []

    for item in order_data.cart_items:
        menu_item = db.query(models.MenuItem).filter(
            models.MenuItem.id == item.menu_item_id,
            models.MenuItem.is_active == True
        ).first()

        if not menu_item:
            raise HTTPException(400, "Menu item not found")

        price_map = {
            models.PizzaSize.SMALL: menu_item.price_small,
            models.PizzaSize.MEDIUM: menu_item.price_medium,
            models.PizzaSize.LARGE: menu_item.price_large,
        }

        base_price = price_map.get(item.size) or menu_item.price_medium

        extras_price = (
            (1.0 if item.extra_cheese else 0) +
            (0.5 if item.extra_sauce else 0)
        )
        crust_price = _crust_price_adjustment(
            db,
            item.crust,
            getattr(item, "crust_option_id", None),
        )

        toppings_price = 0
        topping_models = []

        for t in item.toppings:
            topping = db.query(models.Topping).filter(
                models.Topping.id == t.topping_id,
                models.Topping.is_available == True
            ).first()

            if not topping:
                raise HTTPException(400, "Invalid topping")

            toppings_price += topping.price * t.quantity
            topping_models.append(
                models.OrderItemTopping(
                    topping_id=t.topping_id,
                    quantity=t.quantity
                )
            )

        unit_price = base_price + extras_price + toppings_price + crust_price
        total_price = unit_price * item.quantity
        subtotal += total_price

        order_items.append(
            models.OrderItem(
                menu_item_id=menu_item.id,
                menu_item_name=menu_item.name,
                size=item.size,
                quantity=item.quantity,
                crust=item.crust,
                sauce=item.sauce,
                extra_cheese=item.extra_cheese,
                extra_sauce=item.extra_sauce,
                special_instructions=item.special_instructions,
                unit_price=unit_price,
                total_price=total_price,
                toppings=topping_models
            )
        )
        
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # DELIVERY / PICKUP / DINE-IN LOGIC
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    delivery_fee = 0.0
    estimated_time = datetime.utcnow() + timedelta(minutes=20)

    if order_data.order_type == models.OrderType.DELIVERY:
        area = db.query(models.DeliveryArea).filter(
            models.DeliveryArea.zip_codes.contains(order_data.delivery_zip),
            models.DeliveryArea.is_active == True
        ).first()

        if not area:
            raise HTTPException(400, "Delivery not available for this area")

        if subtotal < area.min_order_amount:
            raise HTTPException(
                400,
                f"Minimum order amount is ${area.min_order_amount}"
            )

        delivery_fee = area.delivery_fee
        estimated_time = datetime.utcnow() + timedelta(
            minutes=area.estimated_delivery_time
        )

    elif order_data.order_type == models.OrderType.PICKUP:
        estimated_time = datetime.utcnow() + timedelta(minutes=15)

    elif order_data.order_type == models.OrderType.DINE_IN:
        estimated_time = datetime.utcnow() + timedelta(minutes=10)

    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # FINAL PRICE
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + tax + delivery_fee, 2)

    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # SAVE ORDER
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    initial_status = (
        models.OrderStatus.PENDING
        if order_data.payment_method == models.PaymentMethod.CASH
        else models.OrderStatus.CONFIRMED
    )

    order = models.Order(
        order_number=_generate_order_number(db),
        user_id=user.id,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        order_type=order_data.order_type,
        delivery_address=order_data.delivery_address,
        delivery_instructions=order_data.delivery_instructions,
        table_number=order_data.table_number,
        notes=order_data.notes,
        delivery_zip=order_data.delivery_zip,
        subtotal=round(subtotal, 2),
        tax=tax,
        delivery_fee=delivery_fee,
        discount=0.0,
        total=total,
        status=initial_status,
        payment_method=order_data.payment_method,
        payment_status=models.PaymentStatus.PENDING,
        estimated_delivery_time=estimated_time,
        items=order_items
    )

    return _persist_order_with_retry(db, order)


@router.post("/{order_number}/approve", response_model=schemas.OrderRead)
def approve_order(
    order_number: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_employee),
):
    order = _get_order_for_update_or_404(db, order_number)

    if order.status == models.OrderStatus.CONFIRMED:
        return order

    if order.status != models.OrderStatus.PENDING:
        return order

    order.status = models.OrderStatus.CONFIRMED

    if (
        order.payment_method == models.PaymentMethod.CASH
        and order.payment_status == models.PaymentStatus.PENDING
    ):
        order.payment_status = models.PaymentStatus.PAID

    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_number}/decline", response_model=schemas.OrderRead)
def decline_order(
    order_number: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_employee),
):
    order = _get_order_for_update_or_404(db, order_number)

    if order.status == models.OrderStatus.CANCELLED:
        return order

    if order.status != models.OrderStatus.PENDING:
        return order

    order.status = models.OrderStatus.CANCELLED

    if (
        order.payment_method == models.PaymentMethod.CASH
        and order.payment_status == models.PaymentStatus.PENDING
    ):
        order.payment_status = models.PaymentStatus.FAILED

    note = (reason or "").strip()
    if note:
        existing = (order.notes or "").strip()
        order.notes = f"{existing}\nDecline reason: {note}".strip()

    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    return order
