import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import { Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API}/products`;
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="products-page">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit mb-4" data-testid="page-title">
              All Products
            </h1>
            <p className="text-lg text-[#718096]">
              Explore our complete collection of toys for kids of all ages
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100" data-testid="filters-sidebar">
                <div className="flex items-center space-x-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-[#2D3748] font-outfit">Filters</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#2D3748] mb-3 font-outfit">Category</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCategoryChange('')}
                        className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                          selectedCategory === ''
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-[#2D3748] hover:bg-gray-100'
                        }`}
                        data-testid="category-all"
                      >
                        All Products
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.name)}
                          className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                            selectedCategory === category.name
                              ? 'bg-primary text-white'
                              : 'bg-gray-50 text-[#2D3748] hover:bg-gray-100'
                          }`}
                          data-testid={`category-filter-${category.name.toLowerCase()}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-xl text-[#718096]">Loading products...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12" data-testid="no-products">
                  <p className="text-xl text-[#718096]">No products found in this category</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-[#718096]" data-testid="product-count">
                      Showing {products.length} products
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;