"""
CRUD operations for database entities
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# User CRUD
async def create_user(db: AsyncIOMotorDatabase, user_data: dict) -> dict:
    """Create a new user"""
    user_data["created_at"] = datetime.utcnow()
    result = await db.users.insert_one(user_data)
    user_data["id"] = str(result.inserted_id)
    return user_data

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    """Get user by email"""
    user = await db.users.find_one({"email": email})
    return serialize_doc(user) if user else None

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[dict]:
    """Get user by ID"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return serialize_doc(user) if user else None

# Product CRUD
async def create_product(db: AsyncIOMotorDatabase, product_data: dict) -> dict:
    """Create a new product"""
    product_data["created_at"] = datetime.utcnow()
    result = await db.products.insert_one(product_data)
    product_data["id"] = str(result.inserted_id)
    return product_data

async def get_product(db: AsyncIOMotorDatabase, product_id: str) -> Optional[dict]:
    """Get product by ID"""
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(product) if product else None

async def get_products(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    """Get products with optional filtering"""
    query = {}
    if category:
        query["category"] = category
    
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    return [serialize_doc(p) for p in products]

async def update_product(
    db: AsyncIOMotorDatabase,
    product_id: str,
    update_data: dict
) -> Optional[dict]:
    """Update a product"""
    update_data = {k: v for k, v in update_data.items() if v is not None}
    if not update_data:
        return None
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_product(db, product_id)
    return None

async def delete_product(db: AsyncIOMotorDatabase, product_id: str) -> bool:
    """Delete a product"""
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    return result.deleted_count > 0

# Order CRUD
async def create_order(db: AsyncIOMotorDatabase, order_data: dict) -> dict:
    """Create a new order"""
    order_data["created_at"] = datetime.utcnow()
    order_data["updated_at"] = datetime.utcnow()
    result = await db.orders.insert_one(order_data)
    order_data["id"] = str(result.inserted_id)
    return order_data

async def get_order(db: AsyncIOMotorDatabase, order_id: str) -> Optional[dict]:
    """Get order by ID"""
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    return serialize_doc(order) if order else None

async def get_user_orders(
    db: AsyncIOMotorDatabase,
    user_id: str,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    """Get orders for a specific user"""
    cursor = db.orders.find({"user_id": user_id}).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    return [serialize_doc(o) for o in orders]

async def update_order(
    db: AsyncIOMotorDatabase,
    order_id: str,
    update_data: dict
) -> Optional[dict]:
    """Update an order"""
    update_data["updated_at"] = datetime.utcnow()
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_order(db, order_id)
    return None

# Payment CRUD
async def create_payment(db: AsyncIOMotorDatabase, payment_data: dict) -> dict:
    """Create a payment record"""
    payment_data["created_at"] = datetime.utcnow()
    result = await db.payments.insert_one(payment_data)
    payment_data["id"] = str(result.inserted_id)
    return payment_data

async def get_payment(db: AsyncIOMotorDatabase, payment_id: str) -> Optional[dict]:
    """Get payment by ID"""
    payment = await db.payments.find_one({"_id": ObjectId(payment_id)})
    return serialize_doc(payment) if payment else None

async def get_payment_by_order(db: AsyncIOMotorDatabase, order_id: str) -> Optional[dict]:
    """Get payment by order ID"""
    payment = await db.payments.find_one({"order_id": order_id})
    return serialize_doc(payment) if payment else None
