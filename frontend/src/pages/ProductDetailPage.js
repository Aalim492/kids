import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { AuthContext, CartContext } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { fetchCartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsAddingToCart(true);
    try {
      await axios.post(`${API}/cart`, {
        product_id: product.id,
        quantity
      });
      toast.success('Added to cart!');
      fetchCartCount();
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await axios.post(`${API}/wishlist/${product.id}`);
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error('Failed to add to wishlist');
      console.error(error);
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

  if (!product) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAFA]" data-testid="product-detail-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-[#718096] hover:text-primary mb-8 transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="product-detail-image"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {product.featured && (
                <div className="inline-block bg-accent text-white text-sm px-4 py-2 rounded-full font-semibold" data-testid="featured-badge">
                  Featured Product
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] font-outfit" data-testid="product-detail-name">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-primary font-outfit" data-testid="product-detail-price">
                  ${product.price}
                </span>
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full" data-testid="in-stock-badge">
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full" data-testid="out-of-stock-badge">
                    Out of Stock
                  </span>
                )}
              </div>

              <p className="text-lg text-[#718096] leading-relaxed" data-testid="product-detail-description">
                {product.description}
              </p>

              <div className="flex items-center space-x-4 pt-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-[#2D3748]">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-semibold transition-colors"
                      data-testid="decrease-quantity"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-display">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-semibold transition-colors"
                      data-testid="increase-quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.stock === 0}
                  className="flex-1 min-w-[200px] bg-primary text-white rounded-full px-8 py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="add-to-cart-button"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className="bg-white border-2 border-primary text-primary rounded-full px-8 py-4 font-bold hover:bg-primary hover:text-white transition-all duration-300 flex items-center space-x-2"
                  data-testid="add-to-wishlist-button"
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">Category:</span>
                  <span className="font-semibold text-[#2D3748]" data-testid="product-category">{product.category}</span>
                </div>
                {product.age_range && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Age Range:</span>
                    <span className="font-semibold text-[#2D3748]" data-testid="product-age-range">{product.age_range}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;