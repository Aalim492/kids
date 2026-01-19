import requests
import sys
import json
from datetime import datetime

class KidsToysAPITester:
    def __init__(self, base_url="https://kidzone-toys-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 Testing Data Seeding...")
        result = self.run_test("Seed Database", "POST", "seed", 200)
        return result is not None

    def test_categories(self):
        """Test categories endpoint"""
        print("\n📂 Testing Categories...")
        result = self.run_test("Get Categories", "GET", "categories", 200)
        if result and isinstance(result, list) and len(result) > 0:
            print(f"   Found {len(result)} categories")
            return True
        return False

    def test_products(self):
        """Test products endpoints"""
        print("\n🧸 Testing Products...")
        
        # Get all products
        products = self.run_test("Get All Products", "GET", "products", 200)
        if not products or not isinstance(products, list):
            return False
        
        print(f"   Found {len(products)} products")
        
        # Get featured products
        featured = self.run_test("Get Featured Products", "GET", "products?featured=true", 200)
        if featured and isinstance(featured, list):
            print(f"   Found {len(featured)} featured products")
        
        # Get products by category
        educational = self.run_test("Get Educational Products", "GET", "products?category=Educational", 200)
        if educational and isinstance(educational, list):
            print(f"   Found {len(educational)} educational products")
        
        # Test individual product
        if products and len(products) > 0:
            product_id = products[0]['id']
            product = self.run_test("Get Single Product", "GET", f"products/{product_id}", 200)
            if product and product.get('id') == product_id:
                print(f"   Successfully retrieved product: {product.get('name')}")
                return True
        
        return False

    def test_auth_register(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        
        if result and result.get('access_token'):
            self.token = result['access_token']
            self.user_id = result['user']['id']
            print(f"   Registered user: {result['user']['name']}")
            return True
        
        return False

    def test_auth_login(self):
        """Test user login with existing credentials"""
        print("\n🔐 Testing User Login...")
        
        # Try to login with the registered user
        if not hasattr(self, 'test_email'):
            return True  # Skip if no test user created
        
        login_data = {
            "email": self.test_email,
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if result and result.get('access_token'):
            print(f"   Logged in user: {result['user']['name']}")
            return True
        
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n👥 Testing Get Current User...")
        
        if not self.token:
            print("   Skipping - no auth token")
            return True
        
        result = self.run_test("Get Current User", "GET", "auth/me", 200)
        
        if result and result.get('id') == self.user_id:
            print(f"   Current user: {result.get('name')}")
            return True
        
        return False

    def test_cart_operations(self):
        """Test cart functionality"""
        print("\n🛒 Testing Cart Operations...")
        
        if not self.token:
            print("   Skipping - no auth token")
            return True
        
        # Get empty cart
        cart = self.run_test("Get Empty Cart", "GET", "cart", 200)
        if not cart:
            return False
        
        # Get a product to add to cart
        products = self.run_test("Get Products for Cart", "GET", "products", 200)
        if not products or len(products) == 0:
            return False
        
        product_id = products[0]['id']
        
        # Add to cart
        add_data = {"product_id": product_id, "quantity": 2}
        add_result = self.run_test("Add to Cart", "POST", "cart", 200, add_data)
        
        if add_result:
            # Get cart with items
            cart_with_items = self.run_test("Get Cart with Items", "GET", "cart", 200)
            if cart_with_items and len(cart_with_items.get('items', [])) > 0:
                print(f"   Cart has {len(cart_with_items['items'])} items")
                
                # Update quantity
                update_result = self.run_test("Update Cart Quantity", "PUT", f"cart/{product_id}?quantity=3", 200)
                
                # Remove from cart
                remove_result = self.run_test("Remove from Cart", "DELETE", f"cart/{product_id}", 200)
                
                return update_result is not None and remove_result is not None
        
        return False

    def test_wishlist_operations(self):
        """Test wishlist functionality"""
        print("\n❤️ Testing Wishlist Operations...")
        
        if not self.token:
            print("   Skipping - no auth token")
            return True
        
        # Get empty wishlist
        wishlist = self.run_test("Get Empty Wishlist", "GET", "wishlist", 200)
        if not wishlist:
            return False
        
        # Get a product to add to wishlist
        products = self.run_test("Get Products for Wishlist", "GET", "products", 200)
        if not products or len(products) == 0:
            return False
        
        product_id = products[0]['id']
        
        # Add to wishlist
        add_result = self.run_test("Add to Wishlist", "POST", f"wishlist/{product_id}", 200)
        
        if add_result:
            # Get wishlist with items
            wishlist_with_items = self.run_test("Get Wishlist with Items", "GET", "wishlist", 200)
            if wishlist_with_items and len(wishlist_with_items.get('items', [])) > 0:
                print(f"   Wishlist has {len(wishlist_with_items['items'])} items")
                
                # Remove from wishlist
                remove_result = self.run_test("Remove from Wishlist", "DELETE", f"wishlist/{product_id}", 200)
                
                return remove_result is not None
        
        return False

    def test_order_operations(self):
        """Test order functionality"""
        print("\n📦 Testing Order Operations...")
        
        if not self.token:
            print("   Skipping - no auth token")
            return True
        
        # Get products for order
        products = self.run_test("Get Products for Order", "GET", "products", 200)
        if not products or len(products) == 0:
            return False
        
        # Create order
        order_data = {
            "items": [
                {
                    "product_id": products[0]['id'],
                    "name": products[0]['name'],
                    "price": products[0]['price'],
                    "quantity": 1
                }
            ],
            "shipping_address": {
                "name": "Test User",
                "address": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zipCode": "12345",
                "phone": "555-1234"
            }
        }
        
        order = self.run_test("Create Order", "POST", "orders", 200, order_data)
        
        if order and order.get('id'):
            print(f"   Created order: {order['id'][:8]}... Total: ${order['total']}")
            
            # Get orders
            orders = self.run_test("Get Orders", "GET", "orders", 200)
            if orders and isinstance(orders, list) and len(orders) > 0:
                print(f"   Found {len(orders)} orders")
                return True
        
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Kids Toys E-commerce API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic endpoints first
        self.test_seed_data()
        self.test_categories()
        products_ok = self.test_products()
        
        # Test authentication
        auth_ok = self.test_auth_register()
        if auth_ok:
            self.test_auth_me()
        
        # Test cart and wishlist (requires auth)
        if auth_ok:
            self.test_cart_operations()
            self.test_wishlist_operations()
            self.test_order_operations()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = KidsToysAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())