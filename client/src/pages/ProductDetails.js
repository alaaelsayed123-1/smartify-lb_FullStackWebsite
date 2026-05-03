import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SentimentAnalyzer from "../components/SentimentAnalyzer";
import { FaArrowLeft, FaHeart, FaShoppingCart, FaMinus, FaPlus, FaCheckCircle, FaTruck, FaShieldAlt } from "react-icons/fa";

const ProductDetails = ({ addToCart, addToFavorites }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToFav, setAddedToFav] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        fetchRecommendations(data.id);
      } else {
        navigate("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recommendations/${productId}`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleAddToFavorites = () => {
    if (product) {
      addToFavorites(product);
      setAddedToFav(true);
      setTimeout(() => setAddedToFav(false), 2000);
    }
  };

  const getImageUrl = (image) => {
    if (!image || image === "" || image === "null") {
      return "https://picsum.photos/500x400?random=1";
    }
    if (image.startsWith('images/')) {
      return `/${image}`;
    }
    return image;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isOnSale = product.sale === 1 || product.sale === true;
  const salePrice = isOnSale ? (product.price * 0.8).toFixed(2) : null;
  const inStock = product.quantity > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        {/* Product Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Image Section */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              <img 
                src={getImageUrl(product.image)} 
                alt={product.name}
                className="relative w-full rounded-2xl object-cover shadow-lg transform group-hover:scale-105 transition-transform duration-500"
              />
              {isOnSale && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                  🔥 SALE -20%
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{product.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-400" />
                    <span className={`${inStock ? 'text-green-400' : 'text-red-400'} font-medium`}>
                      {inStock ? `In Stock (${product.quantity} available)` : "Out of Stock"}
                    </span>
                  </div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <FaShieldAlt className="text-blue-400" />
                    <span className="text-gray-300">1 Year Warranty</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-white/5 rounded-xl p-4">
                {isOnSale ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-gray-400 text-lg line-through">${parseFloat(product.price).toFixed(2)}</span>
                    <span className="text-green-400 text-4xl font-bold">${salePrice}</span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">Save 20%</span>
                  </div>
                ) : (
                  <span className="text-green-400 text-4xl font-bold">${parseFloat(product.price).toFixed(2)}</span>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">Quantity:</span>
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-red-500/50 transition-all flex items-center justify-center"
                  >
                    <FaMinus className="text-white" />
                  </button>
                  <span className="text-white font-bold text-xl min-w-[50px] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-green-500/50 transition-all flex items-center justify-center"
                  >
                    <FaPlus className="text-white" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart} 
                  disabled={!inStock}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    inStock 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                      : 'bg-gray-600 cursor-not-allowed text-gray-300'
                  }`}
                >
                  <FaShoppingCart />
                  {addedToCart ? 'Added!' : `Add ${quantity > 1 ? `${quantity} Items` : "to Cart"}`}
                </button>
                <button 
                  onClick={handleAddToFavorites} 
                  className="flex-1 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg flex items-center justify-center gap-2"
                >
                  <FaHeart />
                  {addedToFav ? 'Added!' : 'Add to Favorites'}
                </button>
              </div>

              {/* Shipping Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-gray-300">
                  <FaTruck className="text-purple-400" />
                  <span>Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <FaShieldAlt className="text-purple-400" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🤖 AI Sentiment Analyzer */}
        <div className="mt-8">
          <SentimentAnalyzer productId={product.id} productName={product.name} />
        </div>

        {/* 🤖 AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white inline-flex items-center gap-3">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🤖 You Might Also Like
                </span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map(rec => (
                <ProductCard
                  key={rec.id}
                  product={rec}
                  addToCart={addToCart}
                  addToFavorites={addToFavorites}
                  onClick={() => navigate(`/products/${rec.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {addedToCart && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50">
          ✓ Added to cart!
        </div>
      )}
      {addedToFav && (
        <div className="fixed bottom-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50">
          ❤️ Added to favorites!
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;