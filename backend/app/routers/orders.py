"""
Orders router for order management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.models import OrderCreate, OrderUpdate, OrderResponse, OrderStatus
from app.database import get_database
from app.auth import get_current_user, get_current_admin
from app.crud import (
    create_order,
    get_order,
    get_user_orders,
    update_order
)

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    order: OrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Create a new order"""
    order_data = order.dict()
    order_data["status"] = OrderStatus.PENDING
    order_data["payment_status"] = "pending"
    
    created_order = await create_order(db, order_data)
    return created_order

@router.get("/", response_model=List[OrderResponse])
async def list_user_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's orders"""
    user_id = current_user.get("sub")  # Email from token
    # In production, you'd get user_id from the user object
    # For now, using email as user identifier
    orders = await get_user_orders(db, user_id, skip=skip, limit=limit)
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific order"""
    order = await get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has access to this order
    if current_user.get("role") != "admin" and order["user_id"] != current_user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this order"
        )
    
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    order_update: OrderUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_admin)
):
    """Update order status (Admin only)"""
    update_data = order_update.dict(exclude_unset=True)
    updated_order = await update_order(db, order_id, update_data)
    
    if not updated_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return updated_order
