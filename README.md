# Kalaasutra - 3D E-commerce Platform

A modern 3D e-commerce platform for customizable products built with FastAPI, React, TypeScript, and Three.js.

## 🎯 Overview

Kalaasutra is a full-stack e-commerce platform featuring:
- **3D Product Previews**: Interactive 3D visualization using React Three Fiber
- **Custom Product Design**: Real-time customization for keychains, bottles, and nameplates
- **Admin & Employee Portals**: Role-based access control
- **Payment Integration**: Razorpay payment gateway
- **Production Tracking**: Order and production status updates

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python 3.11+) - High-performance async API framework
- **MongoDB** with Motor - Async database driver
- **JWT Authentication** - Secure token-based auth with role management
- **Pydantic** - Data validation and serialization

### Frontend
- **React 18** with TypeScript
- **React Three Fiber** & Three.js - 3D graphics
- **TailwindCSS** - Styling
- **Vite** - Build tool

## 📋 Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB (local or Atlas)
- Git

## 🚀 Quick Start

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

The frontend will be available at http://localhost:5173

## 📁 Project Structure

```
kalaasutra/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── database.py       # MongoDB connection
│   │   ├── models.py         # Pydantic schemas
│   │   ├── crud.py           # Database operations
│   │   ├── auth.py           # JWT authentication
│   │   └── routers/          # API endpoints
│   │       ├── auth.py       # Authentication routes
│   │       ├── products.py   # Product management
│   │       ├── orders.py     # Order management
│   │       └── payments.py   # Payment processing
│   ├── tests/                # Backend tests
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
│
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/           # Page components
    │   ├── hooks/           # Custom hooks
    │   └── utils/           # Utilities
    ├── package.json         # Node dependencies
    └── .env.example         # Environment variables template
```

## 🔐 Environment Variables

### Backend (.env)

```env
DATABASE_URL=mongodb://localhost:27017
DB_NAME=kalaasutra
SECRET_KEY=your-secret-key-here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY=your_razorpay_key_id
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- **Authentication**
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user

- **Products**
  - `GET /api/products` - List all products
  - `POST /api/products` - Create product (Admin)
  - `GET /api/products/{id}` - Get product details
  - `PUT /api/products/{id}` - Update product (Admin)
  - `DELETE /api/products/{id}` - Delete product (Admin)

- **Orders**
  - `POST /api/orders` - Create new order
  - `GET /api/orders` - Get user's orders
  - `GET /api/orders/{id}` - Get order details
  - `PUT /api/orders/{id}` - Update order status (Admin)

- **Payments**
  - `POST /api/payments/create` - Create payment order
  - `POST /api/payments/verify` - Verify payment

## 👥 User Roles

- **Admin**: Full access to all features
- **Employee**: Access to production updates
- **User**: Browse products, place orders, track orders

## 🚢 Deployment

### Railway (Recommended for MVP)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### Environment Setup

1. Set up MongoDB Atlas (free M0 tier)
2. Configure environment variables in Railway dashboard
3. Deploy backend and frontend separately

## 📝 Development Timeline

- **Week 1**: Repository setup, authentication, basic API ✅
- **Week 2-3**: Products/Orders CRUD, Razorpay integration
- **Week 4**: 3D preview components, UI polish
- **Week 5**: Admin/Employee portals, testing
- **Week 6**: Deployment, documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Niraj Patil/Shubham Art.

## 📞 Contact

For questions or support, contact the development team.

---

**Date**: January 20, 2026  
**Version**: 1.0.0
