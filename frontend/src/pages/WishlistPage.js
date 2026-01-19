import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import { Heart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WishlistPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API}/wishlist`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="wishlist-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit mb-8" data-testid="wishlist-title">
            My Wishlist
          </h1>

          {products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center" data-testid="empty-wishlist">
              <Heart className="w-16 h-16 text-[#718096] mx-auto mb-4" />
              <p className="text-xl text-[#718096] mb-6">Your wishlist is empty</p>
              <a
                href="/products"
                className="inline-block bg-primary text-white rounded-full px-8 py-4 font-bold hover:bg-primary-hover transition-all"
                data-testid="browse-products-button"
              >
                Browse Products
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="wishlist-products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WishlistPage;