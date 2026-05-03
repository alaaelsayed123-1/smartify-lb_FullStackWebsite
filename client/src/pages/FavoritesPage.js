import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaHeart, FaShoppingCart, FaTrash, FaStar, FaStarHalfAlt, 
  FaArrowLeft, FaTimes, FaBoxOpen, FaGem, FaFire, FaTag
} from "react-icons/fa";

const FavoritesPage = ({ favorites, removeFromFavorites, addToCart }) => {
  const navigate = useNavigate();
  const [addedStates, setAddedStates] = useState({});
  const [removedStates, setRemovedStates] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleAddToCart = (item) => {
    addToCart(item);
    setAddedStates(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedStates(prev => ({ ...prev, [item.id]: false })), 1500);
  };

  const handleRemove = async (item) => {
    setRemovedStates(prev => ({ ...prev, [item.id]: true }));
    await removeFromFavorites(item.product_id);
    setTimeout(() => setRemovedStates(prev => ({ ...prev, [item.id]: false })), 500);
  };

  // Generate random rating for each product (4-5 stars for premium feel)
  const getRating = (id) => {
    const ratings = {};
    if (!ratings[id]) {
      ratings[id] = 4 + Math.random();
    }
    return ratings[id];
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400 text-sm" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} className="text-gray-600 text-sm" />
        ))}
      </div>
    );
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
        </div>

        <div className="relative text-center z-10 animate-fade-in-up">
          <div className="relative inline-block">
            <FaHeart className="text-7xl text-pink-500 mb-6 animate-pulse-slow" />
            <div className="absolute inset-0 bg-pink-500 rounded-full filter blur-2xl opacity-50 animate-ping-slow"></div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
            No Favorites Yet
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
            Start adding products you love to your favorites collection!
          </p>
          <button 
            onClick={() => navigate("/products")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="absolute inset-0 w-0 bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-500 group-hover:w-full"></span>
            <span className="relative flex items-center gap-2">
              <FaArrowLeft className="group-hover:translate-x-[-4px] transition-transform" />
              Browse Products
              <FaFire className="group-hover:rotate-12 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-300 hover:transform hover:-translate-x-1"
              >
                <FaArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
                  My Favorites
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                  {favorites.length} {favorites.length === 1 ? 'item' : 'items'} in your collection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-pink-300 text-sm">❤️ Wishlist</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Grid */}
      <div className="relative container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favorites.map((item, index) => {
            const rating = getRating(item.id);
            const isOnSale = item.sale === 1 || item.sale === true;
            const salePrice = isOnSale ? (parseFloat(item.price) * 0.8).toFixed(2) : null;
            
            return (
              <div
                key={item.id}
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:transform hover:-translate-y-3 hover:shadow-2xl hover:shadow-pink-500/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Sale Badge */}
                {isOnSale && (
                  <div className="absolute top-4 right-4 z-20 animate-pulse-slow">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <FaTag size={10} />
                      -20% OFF
                    </div>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 h-64">
                  <img
                    src={item.image && item.image !== "" && item.image !== "null" && item.image !== "undefined" 
                      ? (item.image.startsWith('http') ? item.image : `/${item.image}`)
                      : `https://picsum.photos/400/300?random=${item.id}`}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-all duration-700 ${hoveredItem === item.id ? 'scale-110 blur-sm' : 'scale-100'}`}
                    onError={(e) => {
                      e.target.src = `https://picsum.photos/400/300?random=${item.id}`;
                    }}
                  />
                  
                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent transition-opacity duration-300 ${hoveredItem === item.id ? 'opacity-100' : 'opacity-0'}`}></div>
                  
                  {/* Quick Actions Overlay */}
                  <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-4 transition-all duration-300 ${hoveredItem === item.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-full transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <FaShoppingCart size={20} />
                    </button>
                    <button
                      onClick={() => handleRemove(item)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 rounded-full transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                    >
                      <FaTrash size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Title */}
                  <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-pink-400 transition-colors">
                    {item.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(rating)}
                      <span className="text-gray-400 text-xs">({(rating * 20).toFixed(0)}+ reviews)</span>
                    </div>
                    {item.quantity <= 10 && item.quantity > 0 && (
                      <span className="text-orange-400 text-xs font-semibold bg-orange-500/20 px-2 py-0.5 rounded-full">
                        ⚡ Low Stock
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    {isOnSale && salePrice ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-gray-400 text-sm line-through">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-2xl">
                            ${salePrice}
                          </span>
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                            Save ${(parseFloat(item.price) - parseFloat(salePrice)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-green-400 font-bold text-2xl">
                        ${parseFloat(item.price).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      item.quantity > 10 ? 'bg-green-500 animate-pulse' : 
                      item.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      item.quantity > 10 ? 'text-green-400' : 
                      item.quantity > 0 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {item.quantity > 10
                        ? "In Stock"
                        : item.quantity > 0
                        ? `Only ${item.quantity} left`
                        : "Out of Stock"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.quantity <= 0}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        item.quantity <= 0 
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                          : addedStates[item.id]
                            ? "bg-green-600 text-white"
                            : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                      }`}
                    >
                      <FaShoppingCart size={14} />
                      {addedStates[item.id] ? "Added!" : (item.quantity <= 0 ? "Out of Stock" : "Add to Cart")}
                    </button>

                    <button
                      onClick={() => handleRemove(item)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        removedStates[item.id]
                          ? "bg-gray-600 text-white"
                          : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                      }`}
                    >
                      <FaTrash size={14} />
                      {removedStates[item.id] ? "Removed!" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative Elements */}
        <div className="fixed bottom-8 right-8 opacity-20 pointer-events-none">
          <FaGem className="text-pink-500 text-6xl animate-spin-slow" />
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};

export default FavoritesPage;