import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'sonner';
import { CartContext } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { fetchCartCount } = useContext(CartContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      if (response.data.items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const getTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderItems = cart.items.map(item => ({
        product_id: item.product_id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const orderResponse = await axios.post(`${API}/orders`, {
        items: orderItems,
        shipping_address: formData
      });

      const orderId = orderResponse.data.id;

      // For now, simulate payment success
      // In production, integrate with PayPal
      toast.success('Order placed successfully!');
      fetchCartCount();
      navigate('/profile');

    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="checkout-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit mb-8" data-testid="checkout-title">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#2D3748] font-outfit mb-6">Shipping Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder="John Doe"
                      data-testid="name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="address">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder="123 Main Street"
                      data-testid="address-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="city">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="New York"
                        data-testid="city-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="state">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="NY"
                        data-testid="state-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="zipCode">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="10001"
                        data-testid="zipcode-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D3748] mb-2" htmlFor="phone">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="(555) 123-4567"
                        data-testid="phone-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary text-white rounded-full px-8 py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="place-order-button"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-8 shadow-sm sticky top-24" data-testid="checkout-summary">
                <h2 className="text-2xl font-bold text-[#2D3748] font-outfit mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cart?.items.map((item) => (
                    <div key={item.product_id} className="flex items-center space-x-3" data-testid={`checkout-item-${item.product_id}`}>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.product?.image}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2D3748] truncate">{item.product?.name}</p>
                        <p className="text-xs text-[#718096]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">${(item.product?.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-[#718096]">
                    <span>Subtotal</span>
                    <span data-testid="checkout-subtotal">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#718096]">
                    <span>Shipping</span>
                    <span className="text-green-600" data-testid="checkout-shipping">Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-[#2D3748] font-outfit">
                    <span>Total</span>
                    <span data-testid="checkout-total">${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;