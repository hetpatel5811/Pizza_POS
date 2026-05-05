# app/routers/payments.py
from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session
import stripe

from app import models, schemas
from app.config import settings
from app.deps import get_current_user, get_db

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


def _ensure_stripe_configured() -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured",
        )


@router.post("/create-intent", response_model=schemas.PaymentIntentResponse)
def create_payment_intent(
    request: schemas.PaymentIntentRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _ensure_stripe_configured()

    order = db.get(models.Order, request.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    expected = round(float(order.total or 0), 2)
    received = round(float(request.amount or 0), 2)
    if expected != received:
        raise HTTPException(status_code=400, detail="Amount mismatch")

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(received * 100),
            currency=request.currency,
            metadata={
                "order_id": str(order.id),
                "created_at": datetime.utcnow().isoformat(),
            },
        )
        return schemas.PaymentIntentResponse(
            client_secret=payment_intent.client_secret,
            payment_intent_id=payment_intent.id,
            amount=received,
            currency=request.currency,
        )
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/confirm", response_model=schemas.PaymentResponse)
def confirm_payment(
    request: schemas.PaymentConfirmRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _ensure_stripe_configured()

    order = db.get(models.Order, request.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        payment_intent = stripe.PaymentIntent.retrieve(request.payment_intent_id)
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    meta_order_id = str((payment_intent.get("metadata") or {}).get("order_id") or "")
    if meta_order_id and meta_order_id != str(order.id):
        raise HTTPException(status_code=400, detail="Payment does not belong to this order")

    if payment_intent.status == "succeeded":
        order.payment_status = models.PaymentStatus.PAID
        if order.status == models.OrderStatus.PENDING:
            order.status = models.OrderStatus.CONFIRMED
        order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(order)
        return schemas.PaymentResponse(
            status="success",
            payment_intent_id=payment_intent.id,
            message="Payment successful",
        )

    return schemas.PaymentResponse(
        status="failed",
        payment_intent_id=payment_intent.id,
        message=f"Payment not completed: {payment_intent.status}",
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    _ensure_stripe_configured()

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe signature")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    event_type = event.get("type")
    payment_intent = event.get("data", {}).get("object", {})

    if event_type == "payment_intent.succeeded":
        _handle_payment_succeeded(payment_intent, db)
    elif event_type == "payment_intent.payment_failed":
        _handle_payment_failed(payment_intent, db)

    return {"status": "success"}


def _handle_payment_succeeded(payment_intent: dict, db: Session) -> None:
    order_id = (payment_intent.get("metadata") or {}).get("order_id")
    if not order_id:
        return

    order = db.get(models.Order, int(order_id))
    if not order:
        return

    order.payment_status = models.PaymentStatus.PAID
    if order.status == models.OrderStatus.PENDING:
        order.status = models.OrderStatus.CONFIRMED
    order.updated_at = datetime.utcnow()
    db.commit()


def _handle_payment_failed(payment_intent: dict, db: Session) -> None:
    order_id = (payment_intent.get("metadata") or {}).get("order_id")
    if not order_id:
        return

    order = db.get(models.Order, int(order_id))
    if not order:
        return

    order.payment_status = models.PaymentStatus.FAILED
    order.updated_at = datetime.utcnow()
    db.commit()


@router.post("/demo-charge", response_model=schemas.PaymentResponse)
def simulate_payment_demo(
    payload: schemas.PaymentRequest,
    user: models.User = Depends(get_current_user),
):
    if not settings.ENABLE_DEMO_PAYMENTS:
        raise HTTPException(status_code=404, detail="Not found")

    if not payload.card_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="card_number is required for demo payment",
        )

    last_digit = payload.card_number.strip()[-1]
    if not last_digit.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid card number",
        )

    if int(last_digit) % 2 == 0:
        reference = "DEMO-" + secrets.token_hex(4).upper()
        return schemas.PaymentResponse(
            status=models.PaymentStatus.PAID,
            reference=reference,
            message="Payment approved (demo)",
        )

    return schemas.PaymentResponse(
        status=models.PaymentStatus.FAILED,
        reference=None,
        message="Payment declined by demo gateway",
    )


@router.post("/demo-confirm/{order_id}", response_model=schemas.PaymentResponse)
def confirm_demo_payment(
    order_id: int,
    payload: schemas.PaymentRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not settings.ENABLE_DEMO_PAYMENTS:
        raise HTTPException(status_code=404, detail="Not found")

    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not payload.card_number:
        raise HTTPException(status_code=400, detail="card_number is required")

    last_digit = payload.card_number.strip()[-1]
    if not last_digit.isdigit():
        raise HTTPException(status_code=400, detail="Invalid card number")

    if int(last_digit) % 2 == 0:
        order.payment_status = models.PaymentStatus.PAID
        order.status = models.OrderStatus.CONFIRMED
        order.updated_at = datetime.utcnow()
        db.commit()
        return schemas.PaymentResponse(
            status="paid",
            reference=f"DEMO-{order.id}",
            message="Demo payment successful",
        )

    order.payment_status = models.PaymentStatus.FAILED
    order.updated_at = datetime.utcnow()
    db.commit()
    return schemas.PaymentResponse(
        status="failed",
        message="Demo payment failed",
    )
