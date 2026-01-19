import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, CartContext } from '../App';
import { ShoppingCart, User, Heart, Menu, X, LogOut, Package } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
              <div className="text-2xl font-bold text-primary font-outfit">KidZone Toys</div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-[#2D3748] hover:text-primary transition-colors" data-testid="home-nav-link">
                Home
              </Link>
              <Link to="/products" className="text-[#2D3748] hover:text-primary transition-colors" data-testid="products-nav-link">
                Products
              </Link>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              {user && (
                <Link to="/wishlist" className="relative" data-testid="wishlist-icon">
                  <Heart className="w-6 h-6 text-[#2D3748] hover:text-accent transition-colors" />
                </Link>
              )}
              
              {user && (
                <Link to="/cart" className="relative" data-testid="cart-icon">
                  <ShoppingCart className="w-6 h-6 text-[#2D3748] hover:text-primary transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="hidden md:flex items-center space-x-2">
                  <Link to="/profile" className="flex items-center space-x-2 text-[#2D3748] hover:text-primary transition-colors" data-testid="profile-link">
                    <User className="w-6 h-6" />
                    <span>{user.name}</span>
                  </Link>
                  <button onClick={handleLogout} className="ml-2 text-[#718096] hover:text-accent" data-testid="logout-button">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="hidden md:block bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-hover transition-all" data-testid="login-button">
                  Login
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200" data-testid="mobile-menu">
            <div className="px-4 py-4 space-y-3">
              <Link to="/" className="block text-[#2D3748] hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/products" className="block text-[#2D3748] hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="block text-[#2D3748] hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left text-accent">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" className="block text-[#2D3748] hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#2D3748] text-white py-20" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold font-outfit mb-4">KidZone Toys</h3>
              <p className="text-gray-400">Quality toys for curious minds</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-outfit">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products?category=Educational" className="hover:text-white transition-colors">Educational</Link></li>
                <li><Link to="/products?category=Outdoor" className="hover:text-white transition-colors">Outdoor</Link></li>
                <li><Link to="/products?category=Puzzles" className="hover:text-white transition-colors">Puzzles</Link></li>
                <li><Link to="/products?category=Dolls" className="hover:text-white transition-colors">Dolls</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-outfit">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-outfit">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2025 KidZone Toys. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;