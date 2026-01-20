"""
Database connection and configuration using Motor (async MongoDB driver)
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

# MongoDB connection settings
MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "kalaasutra")

# Global database client
client: Optional[AsyncIOMotorClient] = None
database = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return database
