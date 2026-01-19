import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="profile-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit mb-8" data-testid="profile-title">
            Order History
          </h1>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center" data-testid="no-orders">
              <Package className="w-16 h-16 text-[#718096] mx-auto mb-4" />
              <p className="text-xl text-[#718096] mb-6">No orders yet</p>
              <a
                href="/products"
                className="inline-block bg-primary text-white rounded-full px-8 py-4 font-bold hover:bg-primary-hover transition-all"
                data-testid="start-shopping-button"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="space-y-6" data-testid="orders-list">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#2D3748] font-outfit" data-testid="order-id">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <div className="flex items-center space-x-2 text-[#718096] text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span data-testid="order-date">
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
                        data-testid="order-status"
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-2xl font-bold text-primary font-outfit" data-testid="order-total">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-[#FAFAFA] rounded-2xl"
                        data-testid={`order-item-${index}`}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#2D3748]" data-testid="order-item-name">{item.name}</p>
                          <p className="text-sm text-[#718096]" data-testid="order-item-quantity">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-primary" data-testid="order-item-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-[#2D3748] mb-2">Shipping Address</h4>
                    <p className="text-[#718096] text-sm" data-testid="shipping-address">
                      {order.shipping_address.name}<br />
                      {order.shipping_address.address}<br />
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}<br />
                      {order.shipping_address.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;