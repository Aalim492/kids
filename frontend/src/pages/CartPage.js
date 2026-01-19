import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartContext } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartPage = () => {
  const navigate = useNavigate();
  const { fetchCartCount } = useContext(CartContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`${API}/cart/${productId}?quantity=${newQuantity}`);
      await fetchCart();
      fetchCartCount();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${API}/cart/${productId}`);
      await fetchCart();
      fetchCartCount();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  const getTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading cart...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="cart-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit mb-8" data-testid="cart-title">
            Shopping Cart
          </h1>

          {!cart || cart.items.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center" data-testid="empty-cart">
              <p className="text-xl text-[#718096] mb-6">Your cart is empty</p>
              <Link
                to="/products"
                className="inline-block bg-primary text-white rounded-full px-8 py-4 font-bold hover:bg-primary-hover transition-all"
                data-testid="continue-shopping-button"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-3xl p-6 shadow-sm flex items-center space-x-6"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    {/* Product Image */}
                    <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100">
                        <img
                          src={item.product?.image}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                          data-testid="cart-item-image"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product_id}`}>
                        <h3 className="font-semibold text-lg text-[#2D3748] font-outfit mb-1" data-testid="cart-item-name">
                          {item.product?.name}
                        </h3>
                      </Link>
                      <p className="text-[#718096] text-sm" data-testid="cart-item-category">{item.product?.category}</p>
                      <p className="text-primary font-bold mt-2" data-testid="cart-item-price">
                        ${item.product?.price}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        data-testid="decrease-quantity-button"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center" data-testid="cart-item-quantity">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        data-testid="increase-quantity-button"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      data-testid="remove-item-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-8 shadow-sm sticky top-24" data-testid="order-summary">
                  <h2 className="text-2xl font-bold text-[#2D3748] font-outfit mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[#718096]">
                      <span>Subtotal</span>
                      <span data-testid="subtotal">${getTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#718096]">
                      <span>Shipping</span>
                      <span className="text-green-600" data-testid="shipping">Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-bold text-[#2D3748] font-outfit">
                      <span>Total</span>
                      <span data-testid="total">${getTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-primary text-white rounded-full px-8 py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    data-testid="proceed-to-checkout-button"
                  >
                    Proceed to Checkout
                  </button>

                  <Link
                    to="/products"
                    className="block text-center mt-4 text-primary hover:underline"
                    data-testid="continue-shopping-link"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;