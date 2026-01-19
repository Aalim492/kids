import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import { ArrowRight, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?featured=true`),
        axios.get(`${API}/categories`)
      ]);
      setFeaturedProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-transparent py-20 md:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-secondary/20 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-[#2D3748]">Quality Toys for Growing Minds</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D3748] font-outfit leading-tight" data-testid="hero-title">
                Spark Joy & Learning
              </h1>
              <p className="text-lg text-[#718096] leading-relaxed" data-testid="hero-description">
                Discover educational and fun toys that inspire creativity, learning, and endless play for kids of all ages.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="bg-primary text-white rounded-full px-8 py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center space-x-2"
                  data-testid="shop-now-button"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/products?category=Educational"
                  className="border-2 border-primary text-primary rounded-full px-8 py-4 font-bold hover:bg-primary hover:text-white transition-all duration-300"
                  data-testid="educational-toys-button"
                >
                  Educational Toys
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1759678444870-1f09f0d9e688?w=600&h=600&fit=crop"
                  alt="Happy child playing"
                  className="w-full h-full object-cover"
                  data-testid="hero-image"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-secondary rounded-3xl p-6 shadow-xl">
                <p className="text-3xl font-bold text-[#2D3748] font-outfit">500+</p>
                <p className="text-sm text-[#718096]">Happy Kids</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] font-outfit mb-4" data-testid="categories-title">
              Shop by Category
            </h2>
            <p className="text-lg text-[#718096]">Find the perfect toy for every age and interest</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.name}`}
                className="group"
                data-testid={`category-${category.name.toLowerCase()}`}
              >
                <div className="bg-[#FAFAFA] rounded-3xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-white">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-center font-semibold text-[#2D3748] font-outfit">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-[#FAFAFA]" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] font-outfit mb-4" data-testid="featured-title">
              Featured Products
            </h2>
            <p className="text-lg text-[#718096]">Our most popular toys loved by kids everywhere</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="bg-secondary text-[#2D3748] rounded-full px-8 py-4 font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 inline-flex items-center space-x-2"
              data-testid="view-all-products-button"
            >
              <span>View All Products</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3748] font-outfit">Safe & Tested</h3>
              <p className="text-[#718096]">All toys meet safety standards</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#2D3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3748] font-outfit">Fast Delivery</h3>
              <p className="text-[#718096]">Free shipping on orders over $50</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3748] font-outfit">Made with Love</h3>
              <p className="text-[#718096]">Quality toys for happy childhoods</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;