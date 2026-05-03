import React, { useState } from "react";
import { FaHeart, FaShoppingCart, FaTag, FaStar, FaStarHalfAlt, FaEye } from "react-icons/fa";
import "../styles/styles.css";

function ProductCard({ product, addToCart, addToFavorites, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToFav, setAddedToFav] = useState(false);
  
  const isOnSale = product.sale === 1 || product.sale === true;
  const salePrice = isOnSale ? (product.price * 0.8).toFixed(2) : null;
  
  // Generate random rating (4-5 stars for demo)
  const rating = 4 + Math.random();
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleAddToFavorites = (e) => {
    e.stopPropagation();
    addToFavorites(product);
    setAddedToFav(true);
    setTimeout(() => setAddedToFav(false), 1500);
  };

  // Get image URL - images are in frontend public/images folder
  const getImageUrl = () => {
    if (product.image && product.image !== "" && product.image !== "null" && product.image !== "undefined") {
      if (product.image.startsWith('images/')) {
        return `/${product.image}`;
      }
      if (product.image.startsWith('http')) {
        return product.image;
      }
      return `/${product.image}`;
    }
    return `https://picsum.photos/350/300?random=${product.id}`;
  };

  return (
    <div
      className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl shadow-lg"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sale Badge */}
      {isOnSale && (
        <div className="absolute top-3 right-3 z-20 animate-pulse-slow">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <FaTag size={10} />
            -20% OFF
          </div>
        </div>
      )}

      {/* Quick View Overlay */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/20 rounded-full p-3 transform transition-transform duration-300 hover:scale-110">
          <FaEye className="text-white text-2xl" />
        </div>
      </div>

      {/* Image Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
        <img
          src={getImageUrl()}
          alt={product.name}
          className={`w-full h-56 object-cover transition-all duration-500 ${isHovered ? 'scale-110 blur-sm' : 'scale-100'}`}
          style={{ 
            filter: isOnSale ? "brightness(0.95)" : "none",
          }}
          onError={(e) => {
            e.target.src = `https://picsum.photos/350/300?random=${product.id}`;
          }}
        />
        
        {/* Stock Badge */}
        {product.quantity <= 10 && product.quantity > 0 && (
          <div className="absolute bottom-3 left-3 bg-orange-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold">
            ⚡ Only {product.quantity} left
          </div>
        )}
        {product.quantity === 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(fullStars)].map((_, i) => (
              <FaStar key={i} className="text-yellow-400 text-sm" />
            ))}
            {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
            {[...Array(5 - Math.ceil(rating))].map((_, i) => (
              <FaStar key={i} className="text-gray-600 text-sm" />
            ))}
          </div>
          <span className="text-gray-400 text-xs">({(rating * 20).toFixed(0)}+ reviews)</span>
        </div>

        {/* Price */}
        <div className="space-y-1">
          {isOnSale && salePrice ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-gray-400 text-sm line-through">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold text-xl">
                  ${salePrice}
                </span>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Save ${(parseFloat(product.price) - parseFloat(salePrice)).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-green-400 font-bold text-xl">
              ${parseFloat(product.price).toFixed(2)}
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            product.quantity > 10 ? 'bg-green-500 animate-pulse' : 
            product.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-xs font-medium ${
            product.quantity > 10 ? 'text-green-400' : 
            product.quantity > 0 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {product.quantity > 10
              ? "In Stock"
              : product.quantity > 0
              ? `Low Stock (${product.quantity} left)`
              : "Out of Stock"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddToCart}
            disabled={product.quantity <= 0}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              product.quantity <= 0 
                ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                : addedToCart
                  ? "bg-green-600 text-white"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
            }`}
          >
            <FaShoppingCart size={14} />
            {addedToCart ? "Added!" : (product.quantity <= 0 ? "Out of Stock" : "Add to Cart")}
          </button>

          <button
            onClick={handleAddToFavorites}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              addedToFav
                ? "bg-pink-600 text-white"
                : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 hover:shadow-lg hover:shadow-pink-500/25 transform hover:scale-105"
            }`}
          >
            <FaHeart size={14} />
            {addedToFav ? "Added!" : "Favorite"}
          </button>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default ProductCard;