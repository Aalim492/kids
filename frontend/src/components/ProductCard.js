import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { AuthContext, CartContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductCard = ({ product }) => {
  const { user } = useContext(AuthContext);
  const { fetchCartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsAddingToCart(true);
    try {
      await axios.post(`${API}/cart`, {
        product_id: product.id,
        quantity: 1
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

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
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

  return (
    <Link to={`/products/${product.id}`} data-testid={`product-card-${product.id}`}>
      <div className="group relative bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl mb-4 bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid="product-image"
          />
          {product.featured && (
            <div className="absolute top-2 right-2 bg-accent text-white text-xs px-3 py-1 rounded-full font-semibold" data-testid="featured-badge">
              Featured
            </div>
          )}
          {/* Wishlist button - appears on hover */}
          <button
            onClick={handleAddToWishlist}
            className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            data-testid="wishlist-button"
          >
            <Heart className="w-5 h-5 text-[#2D3748] hover:text-accent" />
          </button>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg text-[#2D3748] font-outfit line-clamp-1" data-testid="product-name">
              {product.name}
            </h3>
            <span className="text-primary font-bold text-lg whitespace-nowrap" data-testid="product-price">
              ${product.price}
            </span>
          </div>

          <p className="text-sm text-[#718096] line-clamp-2" data-testid="product-description">
            {product.description}
          </p>

          {product.age_range && (
            <p className="text-xs text-[#718096] font-medium" data-testid="product-age-range">
              Ages: {product.age_range}
            </p>
          )}

          {/* Quick Add button - appears on hover */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stock === 0}
            className="w-full mt-3 bg-primary text-white rounded-full px-6 py-3 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-hover hover:-translate-y-1 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="quick-add-button"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{product.stock === 0 ? 'Out of Stock' : isAddingToCart ? 'Adding...' : 'Quick Add'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;