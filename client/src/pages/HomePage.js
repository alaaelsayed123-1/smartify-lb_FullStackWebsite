import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { FaArrowRight, FaRobot, FaStar, FaGem, FaShoppingBag, FaTruck, FaShieldAlt, FaHeadset } from "react-icons/fa";

import applewatch from "../images/applewatch.jpeg";
import headphone from "../images/headphone.jpeg";
import iphone17promax from "../images/iphone17promax.webp";
import laptop from "../images/laptop.avif";
import lgscreen from "../images/lgscreen.jpg";
import pcsetup from "../images/pcsetup.webp";

const HomePage = ({ addToCart, addToFavorites }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const images = [applewatch, headphone, iphone17promax, laptop, lgscreen, pcsetup];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchPersonalizedRecs();
    }
  }, [isAuthenticated, token]);

  const fetchPersonalizedRecs = async () => {
    setLoadingRecs(true);
    try {
      const response = await fetch("http://localhost:5000/api/personalized-recommendations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPersonalizedRecs(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const features = [
    { icon: FaTruck, title: "Free Shipping", desc: "On orders over $50", color: "blue" },
    { icon: FaShieldAlt, title: "Secure Payment", desc: "100% protected", color: "green" },
    { icon: FaHeadset, title: "24/7 Support", desc: "Always here to help", color: "purple" },
    { icon: FaGem, title: "Premium Quality", desc: "Top brands only", color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>
      </div>

      {/* Dynamic Cursor Glow */}
      <div 
        className="fixed w-96 h-96 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 filter blur-3xl opacity-20 transition-all duration-300 pointer-events-none"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Content */}
      <div className="relative" onMouseMove={handleMouseMove}>
        {/* Hero Section with Carousel */}
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Carousel Background */}
          <div className="absolute inset-0 z-0">
            {images.map((img, index) => (
              <div
                key={index}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                  opacity: index === currentImageIndex ? 1 : 0,
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.4) scale(1.05)',
                  transform: `scale(${index === currentImageIndex ? '1.05' : '1'})`,
                  transition: 'transform 8s ease-out',
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <div className="animate-fade-in-down">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
                <FaStar className="text-yellow-400 text-sm animate-pulse" />
                <span className="text-white text-sm font-semibold">Premium Electronics Store</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Welcome to Smartify LB
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Discover top electronics — carefully selected, great prices and fast delivery.
            </p>
            
            <button
              onClick={() => navigate("/products")}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:transform hover:-translate-y-1 animate-fade-in-up animation-delay-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span>Shop Now</span>
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'w-8 h-2 bg-purple-500' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                } rounded-full`}
                onClick={() => {
                  setFade(false);
                  setTimeout(() => {
                    setCurrentImageIndex(index);
                    setFade(true);
                  }, 500);
                }}
              />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Smartify?</h2>
              <p className="text-gray-300 text-lg">Experience the best online shopping experience</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 cursor-pointer"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Personalized Recommendations Section */}
        {isAuthenticated && personalizedRecs.length > 0 && !loadingRecs && (
          <div className="relative py-20 px-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30 mb-4">
                  <FaRobot className="text-purple-400 text-lg animate-pulse" />
                  <span className="text-purple-300 text-sm font-semibold">AI Powered</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Personalized For You</h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Based on your browsing history and preferences, we hand-picked these items just for you
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {personalizedRecs.slice(0, 4).map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ProductCard
                      product={product}
                      addToCart={addToCart}
                      addToFavorites={addToFavorites}
                      onClick={() => navigate(`/products/${product.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State for Recommendations */}
        {isAuthenticated && loadingRecs && (
          <div className="relative py-20 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white">Loading personalized recommendations...</span>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="relative py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-center border border-white/10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Stay Updated</h3>
              <p className="text-gray-300 mb-6">Get the latest deals and exclusive offers straight to your inbox</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(30px) translateX(-20px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.15; }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;