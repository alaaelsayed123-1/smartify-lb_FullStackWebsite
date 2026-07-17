// ============================================================
// HOMEPAGE COMPONENT - SMARTIFY LB
// ============================================================
// Main landing page after the splash screen
// Contains:
// - Hero section with image carousel
// - Feature cards (shipping, security, support, quality)
// - AI-powered personalized recommendations (for logged-in users)
// - Newsletter subscription section
// - Animated backgrounds and cursor glow effect
// ============================================================

// Import React and necessary hooks
import React, { useState, useEffect } from "react";

// Import navigation hook for page routing
import { useNavigate } from "react-router-dom";

// Import authentication context hook
import { useAuth } from "../context/AuthContext";

// Import reusable product card component
import ProductCard from "../components/ProductCard";

// Import icons for UI elements
import { FaArrowRight, FaRobot, FaStar, FaGem, FaShoppingBag, FaTruck, FaShieldAlt, FaHeadset } from "react-icons/fa";

// Import product images for the carousel
import applewatch from "../images/applewatch.jpeg";
import headphone from "../images/headphone.jpeg";
import iphone17promax from "../images/iphone17promax.webp";
import laptop from "../images/laptop.avif";
import lgscreen from "../images/lgscreen.jpg";
import pcsetup from "../images/pcsetup.webp";

// Import the separate CSS file
import "../styles/HomePage.css";

// ============================================================
// HOMEPAGE COMPONENT
// Receives addToCart and addToFavorites functions as props
// ============================================================
const HomePage = ({ addToCart, addToFavorites }) => {
  
  // ----------------------------------------
  // HOOKS & STATE
  // ----------------------------------------
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  
  // State for AI-powered recommendations
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // Track which feature card is hovered (for hover effects)
  const [hoveredFeature, setHoveredFeature] = useState(null);
  
  // Track mouse position for dynamic cursor glow effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Carousel images array
  const images = [applewatch, headphone, iphone17promax, laptop, lgscreen, pcsetup];
  
  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // ----------------------------------------
  // AUTO-ROTATING CAROUSEL EFFECT
  // Changes image every 4 seconds with fade
  // ----------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Start fade out
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setFade(true); // Start fade in
      }, 500); // Wait for fade out to complete
    }, 4000); // Change every 4 seconds
    
    return () => clearInterval(interval);
  }, [images.length]);

  // ----------------------------------------
  // FETCH PERSONALIZED RECOMMENDATIONS
  // Only runs when user is authenticated
  // ----------------------------------------
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchPersonalizedRecs();
    }
  }, [isAuthenticated, token]);

  // API call to get AI-powered recommendations
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

  // ----------------------------------------
  // MOUSE TRACKING FOR CURSOR GLOW
  // Calculates mouse position as percentage
  // ----------------------------------------
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // ----------------------------------------
  // FEATURE CARDS DATA
  // Key selling points of the store
  // ----------------------------------------
  const features = [
    { icon: FaTruck, title: "Free Shipping", desc: "On orders over $50", color: "blue" },
    { icon: FaShieldAlt, title: "Secure Payment", desc: "100% protected", color: "green" },
    { icon: FaHeadset, title: "24/7 Support", desc: "Always here to help", color: "purple" },
    { icon: FaGem, title: "Premium Quality", desc: "Top brands only", color: "orange" },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="homepage">
      
      {/* ---- Animated Background Orbs ---- */}
      <div className="background-orbs">
        <div className="orb orb-purple"></div>
        <div className="orb orb-pink"></div>
        <div className="orb orb-blue-pulse"></div>
      </div>

      {/* ---- Dynamic Cursor Glow ---- */}
      <div 
        className="cursor-glow"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
        }}
      />

      {/* ---- Main Content (tracks mouse) ---- */}
      <div className="main-content" onMouseMove={handleMouseMove}>
        
        {/* ============================================================ */}
        {/* HERO SECTION WITH IMAGE CAROUSEL */}
        {/* ============================================================ */}
        <div className="hero-section">
          
          {/* Carousel Background Images */}
          <div className="carousel-background">
            {images.map((img, index) => (
              <div
                key={index}
                className={`carousel-image ${index === currentImageIndex ? 'carousel-image-active' : ''}`}
                style={{
                  backgroundImage: `url(${img})`,
                  opacity: index === currentImageIndex ? 1 : 0,
                  transform: `scale(${index === currentImageIndex ? '1.05' : '1'})`,
                }}
              />
            ))}
            {/* Gradient overlay for text readability */}
            <div className="carousel-overlay"></div>
          </div>

          {/* Hero Content - Centered text */}
          <div className="hero-content">
            
            {/* Premium Badge */}
            <div className="animate-fade-in-down">
              <div className="premium-badge">
                <FaStar className="premium-star" />
                <span>Premium Electronics Store</span>
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="hero-heading animate-fade-in-up">
              <span className="gradient-text">
                Welcome to Smartify LB
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="hero-subtitle animate-fade-in-up animation-delay-200">
              Discover top electronics — carefully selected, great prices and fast delivery.
            </p>
            
            {/* Shop Now Button */}
            <button
              onClick={() => navigate("/products")}
              className="shop-now-btn animate-fade-in-up animation-delay-400"
            >
              <div className="btn-shimmer"></div>
              <span>Shop Now</span>
              <FaArrowRight className="btn-arrow" />
            </button>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentImageIndex ? 'carousel-dot-active' : 'carousel-dot-inactive'}`}
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

        {/* ============================================================ */}
        {/* FEATURES SECTION - Why choose Smartify */}
        {/* ============================================================ */}
        <div className="features-section">
          <div className="features-container">
            
            {/* Section Header */}
            <div className="section-header">
              <h2 className="section-title">Why Choose Smartify?</h2>
              <p className="section-subtitle">Experience the best online shopping experience</p>
            </div>
            
            {/* Features Grid */}
            <div className="features-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card feature-${feature.color}`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  {/* Hover glow effect */}
                  <div className="feature-glow"></div>
                  
                  <div className="feature-content">
                    {/* Icon */}
                    <div className="feature-icon">
                      <feature.icon />
                    </div>
                    {/* Title & Description */}
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* AI PERSONALIZED RECOMMENDATIONS */}
        {/* Only visible for authenticated users with data */}
        {/* ============================================================ */}
        {isAuthenticated && personalizedRecs.length > 0 && !loadingRecs && (
          <div className="recommendations-section">
            <div className="recommendations-container">
              
              {/* Section Header with AI badge */}
              <div className="section-header">
                <div className="ai-badge">
                  <FaRobot className="ai-robot-icon" />
                  <span>AI Powered</span>
                </div>
                <h2 className="section-title">Personalized For You</h2>
                <p className="section-subtitle">
                  Based on your browsing history and preferences, we hand-picked these items just for you
                </p>
              </div>
              
              {/* Product Cards Grid */}
              <div className="products-grid">
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

        {/* ============================================================ */}
        {/* LOADING STATE for Recommendations */}
        {/* ============================================================ */}
        {isAuthenticated && loadingRecs && (
          <div className="loading-section">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span>Loading personalized recommendations...</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* NEWSLETTER SECTION */}
        {/* ============================================================ */}
        <div className="newsletter-section">
          <div className="newsletter-container">
            <div className="newsletter-card">
              <h3 className="newsletter-title">Stay Updated</h3>
              <p className="newsletter-desc">Get the latest deals and exclusive offers straight to your inbox</p>
              
              {/* Email Input & Subscribe Button */}
              <div className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="newsletter-input"
                />
                <button className="newsletter-btn">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export component for use in routing
export default HomePage;