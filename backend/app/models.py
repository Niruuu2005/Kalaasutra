"""
Pydantic models/schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User Models
class UserRole(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    USER = "user"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Product Models
class ProductTemplate(BaseModel):
    font: str = "Arial"
    color: str = "#FFD700"

class ProductBase(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    name: str
    category: str  # keychains, bottles, nameplates
    price: float
    description: Optional[str] = None
    model_url: Optional[str] = None  # GLB model URL
    templates: List[ProductTemplate] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    model_url: Optional[str] = None
    templates: Optional[List[ProductTemplate]] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime

# Order Models
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class CustomizationData(BaseModel):
    text: Optional[str] = None
    font: Optional[str] = None
    color: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    quantity: int = 1
    customization: Optional[CustomizationData] = None
    price: float

class OrderBase(BaseModel):
    items: List[OrderItem]
    total_amount: float
    shipping_address: str
    contact_number: str

class OrderCreate(OrderBase):
    user_id: str

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    tracking_number: Optional[str] = None

class OrderResponse(OrderBase):
    id: str
    user_id: str
    status: OrderStatus
    payment_status: str = "pending"
    tracking_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Payment Models
class PaymentCreate(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    currency: str
    status: str
    created_at: datetime
