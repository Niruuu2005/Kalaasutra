"""
Payments router for Razorpay integration
"""
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import hmac
import hashlib
import os

from app.models import PaymentCreate, PaymentVerify, PaymentResponse
from app.database import get_database
from app.auth import get_current_user
from app.crud import create_payment, get_payment_by_order, update_order

router = APIRouter(prefix="/payments", tags=["Payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

@router.post("/create", response_model=dict)
async def create_payment_order(
    payment: PaymentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay payment order"""
    # In production, integrate with Razorpay SDK
    # For now, returning a mock response
    
    payment_data = payment.dict()
    payment_data["status"] = "created"
    payment_data["razorpay_order_id"] = f"order_{payment.order_id}"
    
    created_payment = await create_payment(db, payment_data)
    
    return {
        "id": created_payment["id"],
        "razorpay_order_id": payment_data["razorpay_order_id"],
        "amount": payment.amount,
        "currency": payment.currency,
        "key": RAZORPAY_KEY_ID
    }

@router.post("/verify")
async def verify_payment(
    payment_verify: PaymentVerify,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature"""
    # Verify signature
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{payment_verify.razorpay_order_id}|{payment_verify.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if generated_signature != payment_verify.razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )
    
    # Update order payment status
    # Extract order_id from razorpay_order_id (remove 'order_' prefix)
    order_id = payment_verify.razorpay_order_id.replace("order_", "")
    
    await update_order(db, order_id, {
        "payment_status": "completed",
        "status": "confirmed"
    })
    
    return {
        "success": True,
        "message": "Payment verified successfully"
    }

@router.get("/order/{order_id}", response_model=PaymentResponse)
async def get_payment_for_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get payment details for an order"""
    payment = await get_payment_by_order(db, order_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found for this order"
        )
    return payment
