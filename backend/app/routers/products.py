"""
Products router for product management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from app.models import ProductCreate, ProductUpdate, ProductResponse
from app.database import get_database
from app.auth import get_current_user, get_current_admin
from app.crud import (
    create_product,
    get_product,
    get_products,
    update_product,
    delete_product
)

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_admin)
):
    """Create a new product (Admin only)"""
    product_data = product.dict()
    created_product = await create_product(db, product_data)
    return created_product

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get list of products"""
    products = await get_products(db, category=category, skip=skip, limit=limit)
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a single product by ID"""
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product_by_id(
    product_id: str,
    product_update: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_admin)
):
    """Update a product (Admin only)"""
    update_data = product_update.dict(exclude_unset=True)
    updated_product = await update_product(db, product_id, update_data)
    
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_by_id(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_admin)
):
    """Delete a product (Admin only)"""
    deleted = await delete_product(db, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return None
