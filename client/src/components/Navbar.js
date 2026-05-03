import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaStore, FaHeart, FaShoppingCart, FaSignOutAlt, FaUser, FaCrown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ cart = [], favorites = [] }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-200">
              <span className="text-blue-600 font-bold text-xl">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight group-hover:text-gray-100 transition-colors">
              Smartify LB
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <Link to="/home" className="nav-link">
              <FaHome className="text-lg" />
              <span className="hidden md:inline ml-1">Home</span>
            </Link>

            <Link to="/products" className="nav-link">
              <FaStore className="text-lg" />
              <span className="hidden md:inline ml-1">Products</span>
            </Link>

            <Link to="/favorites" className="nav-link relative">
              <FaHeart className="text-lg" />
              <span className="hidden md:inline ml-1">Favorites</span>
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {favorites.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="nav-link relative">
              <FaShoppingCart className="text-lg" />
              <span className="hidden md:inline ml-1">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link to="/about" className="nav-link">
              <span className="hidden md:inline">About</span>
            </Link>

            <Link to="/admin" className="nav-link">
              <FaCrown className="text-lg" />
              <span className="hidden md:inline ml-1">Admin</span>
            </Link>

            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <span className="text-white font-medium text-sm hidden md:inline">
                    {user?.first_name || user?.username || "User"}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="nav-link hover:bg-red-600/20 transition-all duration-300"
                >
                  <FaSignOutAlt className="text-lg" />
                  <span className="hidden md:inline ml-1">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-all duration-300">
                <FaUser className="text-lg" />
                <span className="hidden md:inline ml-1">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl z-50">
        <div className="flex justify-around py-2">
          <Link to="/home" className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors">
            <FaHome className="text-xl" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/products" className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors">
            <FaStore className="text-xl" />
            <span className="text-xs mt-1">Shop</span>
          </Link>
          <Link to="/favorites" className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors relative">
            <FaHeart className="text-xl" />
            <span className="text-xs mt-1">Wishlist</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
          <Link to="/cart" className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors relative">
            <FaShoppingCart className="text-xl" />
            <span className="text-xs mt-1">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors">
              <FaSignOutAlt className="text-xl" />
              <span className="text-xs mt-1">Logout</span>
            </button>
          ) : (
            <Link to="/login" className="flex flex-col items-center py-1 px-3 text-white hover:text-gray-200 transition-colors">
              <FaUser className="text-xl" />
              <span className="text-xs mt-1">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Add padding for mobile to prevent content hiding behind bottom nav */}
      <style jsx>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 60px;
          }
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          color: white;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
          text-decoration: none;
          font-weight: 500;
        }
        
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;