from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# PayPal client setup
paypal_client_id = os.environ.get('PAYPAL_CLIENT_ID', '')
paypal_secret = os.environ.get('PAYPAL_SECRET', '')
if paypal_client_id and paypal_secret:
    environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
    paypal_client = PayPalHttpClient(environment)
else:
    paypal_client = None

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    price: float
    category: str
    stock: int
    image: str
    featured: bool = False
    age_range: Optional[str] = None
    created_at: datetime

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int
    image: str
    featured: bool = False
    age_range: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    product: Optional[Product] = None

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1

class WishlistItem(BaseModel):
    product_id: str
    added_at: datetime

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    items: List[str] = []  # product_ids

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[OrderItem]
    total: float
    status: str  # pending, paid, shipped, delivered
    payment_id: Optional[str] = None
    shipping_address: dict
    created_at: datetime

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: dict

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    image: str

# ============ AUTH HELPERS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    user = User(id=user_id, email=user_data.email, name=user_data.name, created_at=datetime.now(timezone.utc))
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        created_at=datetime.fromisoformat(user_doc["created_at"]) if isinstance(user_doc["created_at"], str) else user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ PRODUCT ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        **product_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    product_doc['created_at'] = datetime.fromisoformat(product_doc['created_at'])
    
    return Product(**product_doc)

# ============ CART ROUTES ============

@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not cart:
        cart = {
            "user_id": current_user.id,
            "items": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart)
    
    # Populate product details
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            item["product"] = Product(**product)
    
    if isinstance(cart.get('updated_at'), str):
        cart['updated_at'] = datetime.fromisoformat(cart['updated_at'])
    
    return Cart(**cart)

@api_router.post("/cart")
async def add_to_cart(item_data: CartItemAdd, current_user: User = Depends(get_current_user)):
    # Check if product exists
    product = await db.products.find_one({"id": item_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": current_user.id})
    
    if not cart:
        cart = {
            "user_id": current_user.id,
            "items": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart)
    
    # Check if item already in cart
    item_found = False
    for item in cart.get("items", []):
        if item["product_id"] == item_data.product_id:
            item["quantity"] += item_data.quantity
            item_found = True
            break
    
    if not item_found:
        cart["items"] = cart.get("items", []) + [{"product_id": item_data.product_id, "quantity": item_data.quantity}]
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    
    if cart:
        cart["items"] = [item for item in cart.get("items", []) if item["product_id"] != product_id]
        await db.carts.update_one(
            {"user_id": current_user.id},
            {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{product_id}")
async def update_cart_quantity(product_id: str, quantity: int, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    
    if cart:
        for item in cart.get("items", []):
            if item["product_id"] == product_id:
                item["quantity"] = quantity
                break
        
        await db.carts.update_one(
            {"user_id": current_user.id},
            {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Cart updated"}

# ============ WISHLIST ROUTES ============

@api_router.get("/wishlist")
async def get_wishlist(current_user: User = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not wishlist:
        wishlist = {"user_id": current_user.id, "items": []}
        await db.wishlists.insert_one(wishlist)
    
    # Populate product details
    products = []
    for product_id in wishlist.get("items", []):
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            products.append(Product(**product))
    
    return {"user_id": current_user.id, "items": wishlist.get("items", []), "products": products}

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    # Check if product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wishlist = await db.wishlists.find_one({"user_id": current_user.id})
    
    if not wishlist:
        wishlist = {"user_id": current_user.id, "items": []}
        await db.wishlists.insert_one(wishlist)
    
    if product_id not in wishlist.get("items", []):
        await db.wishlists.update_one(
            {"user_id": current_user.id},
            {"$push": {"items": product_id}}
        )
    
    return {"message": "Item added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    await db.wishlists.update_one(
        {"user_id": current_user.id},
        {"$pull": {"items": product_id}}
    )
    
    return {"message": "Item removed from wishlist"}

# ============ ORDER ROUTES ============

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    total = sum(item.price * item.quantity for item in order_data.items)
    
    order_doc = {
        "id": order_id,
        "user_id": current_user.id,
        "items": [item.model_dump() for item in order_data.items],
        "total": total,
        "status": "pending",
        "payment_id": None,
        "shipping_address": order_data.shipping_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Clear cart after order
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    order_doc['created_at'] = datetime.fromisoformat(order_doc['created_at'])
    
    return Order(**order_doc)

# ============ PAYPAL ROUTES ============

@api_router.post("/paypal/create-order")
async def create_paypal_order(order_id: str, current_user: User = Depends(get_current_user)):
    if not paypal_client:
        raise HTTPException(status_code=503, detail="PayPal integration not configured")
    
    # Get order
    order = await db.orders.find_one({"id": order_id, "user_id": current_user.id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    request = OrdersCreateRequest()
    request.prefer('return=representation')
    request.request_body = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": order_id,
            "amount": {
                "currency_code": "USD",
                "value": f"{order['total']:.2f}"
            }
        }]
    }
    
    try:
        response = paypal_client.execute(request)
        return {"id": response.result.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")

@api_router.post("/paypal/capture-order")
async def capture_paypal_order(paypal_order_id: str, order_id: str, current_user: User = Depends(get_current_user)):
    if not paypal_client:
        raise HTTPException(status_code=503, detail="PayPal integration not configured")
    
    request = OrdersCaptureRequest(paypal_order_id)
    
    try:
        response = paypal_client.execute(request)
        
        # Update order status
        await db.orders.update_one(
            {"id": order_id, "user_id": current_user.id},
            {"$set": {"status": "paid", "payment_id": paypal_order_id}}
        )
        
        return {"status": "success", "payment_id": paypal_order_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")

# ============ CATEGORY ROUTES ============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    product_count = await db.products.count_documents({})
    if product_count > 0:
        return {"message": "Database already seeded"}
    
    # Seed categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Educational", "image": "https://images.unsplash.com/photo-1637728225412-6210ff05c6f4?w=400"},
        {"id": str(uuid.uuid4()), "name": "Outdoor", "image": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400"},
        {"id": str(uuid.uuid4()), "name": "Puzzles", "image": "https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400"},
        {"id": str(uuid.uuid4()), "name": "Dolls", "image": "https://images.pexels.com/photos/31061855/pexels-photo-31061855.jpeg?w=400"},
        {"id": str(uuid.uuid4()), "name": "Building Blocks", "image": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400"},
        {"id": str(uuid.uuid4()), "name": "Action Figures", "image": "https://images.unsplash.com/photo-1579946081291-b5c0ecea3e49?w=400"}
    ]
    await db.categories.insert_many(categories)
    
    # Seed products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Wooden Alphabet Blocks",
            "description": "Classic wooden blocks with letters and numbers for early learning",
            "price": 24.99,
            "category": "Educational",
            "stock": 50,
            "image": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500",
            "featured": True,
            "age_range": "2-5 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rainbow Stacking Rings",
            "description": "Colorful stacking rings to develop motor skills and color recognition",
            "price": 18.99,
            "category": "Educational",
            "stock": 75,
            "image": "https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=500",
            "featured": True,
            "age_range": "0-3 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Building Blocks Set",
            "description": "100-piece colorful building blocks for creative construction",
            "price": 34.99,
            "category": "Building Blocks",
            "stock": 60,
            "image": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500",
            "featured": True,
            "age_range": "3-8 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Jigsaw Puzzle 100 Pieces",
            "description": "Colorful jigsaw puzzle featuring animals and nature",
            "price": 15.99,
            "category": "Puzzles",
            "stock": 100,
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
            "featured": False,
            "age_range": "5-8 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Plush Teddy Bear",
            "description": "Soft and cuddly teddy bear, perfect companion for kids",
            "price": 22.99,
            "category": "Dolls",
            "stock": 80,
            "image": "https://images.pexels.com/photos/31061855/pexels-photo-31061855.jpeg?w=500",
            "featured": True,
            "age_range": "0-5 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Outdoor Soccer Ball",
            "description": "Durable soccer ball for outdoor play and sports",
            "price": 19.99,
            "category": "Outdoor",
            "stock": 45,
            "image": "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aac?w=500",
            "featured": False,
            "age_range": "6-12 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Art & Craft Kit",
            "description": "Complete art set with paints, brushes, and canvas",
            "price": 29.99,
            "category": "Educational",
            "stock": 40,
            "image": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500",
            "featured": False,
            "age_range": "4-10 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Musical Xylophone",
            "description": "Colorful wooden xylophone with 8 notes for musical exploration",
            "price": 26.99,
            "category": "Educational",
            "stock": 55,
            "image": "https://images.unsplash.com/photo-1621111848501-8d3634f82336?w=500",
            "featured": True,
            "age_range": "2-6 years",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.products.insert_many(products)
    
    return {"message": "Database seeded successfully", "products": len(products), "categories": len(categories)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()