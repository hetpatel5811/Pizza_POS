from fastapi import APIRouter
from app import schemas

router = APIRouter(tags=["Cart"])

TAX_RATE = 0.13  # Canada HST (13%)


@router.post(
    "/calculate-simple",
    response_model=schemas.SimpleCartCalculateResponse
)
def calculate_cart_simple(payload: schemas.SimpleCartCalculateRequest):
    """
    Cart sidebar calculation ONLY.
    - Subtotal
    - 13% Canada tax
    - Total
    - No delivery / pickup / DB logic
    """

    subtotal = round(
        sum(item.price * item.quantity for item in payload.items),
        2
    )

    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + tax, 2)

    return schemas.SimpleCartCalculateResponse(
        subtotal=subtotal,
        tax=tax,
        total=total
    )
