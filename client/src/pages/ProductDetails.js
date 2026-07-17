// Import React core and hooks for state management and side effects
import React, { useState, useEffect } from "react";
// Import hooks for URL parameter extraction and programmatic navigation
import { useParams, useNavigate } from "react-router-dom";
// Import reusable ProductCard component for recommendations section
import ProductCard from "../components/ProductCard";
// Import AI-powered sentiment analysis component for product reviews
import SentimentAnalyzer from "../components/SentimentAnalyzer";
// Import icons from react-icons library for visual elements throughout the page
import { FaArrowLeft, FaHeart, FaShoppingCart, FaMinus, FaPlus, FaCheckCircle, FaTruck, FaShieldAlt } from "react-icons/fa";

/**
 * ProductDetails Component
 * Displays detailed information about a single product including:
 * - Product image with sale badge overlay
 * - Product name, price, stock status, warranty info
 * - Quantity selector with +/- buttons
 * - Add to cart and add to favorites buttons
 * - AI-powered product recommendations
 * - Sentiment analysis of product reviews
 * - Toast notifications for user actions
 * 
 * @param {Object} props - Component props passed from App.js via route
 * @param {Function} props.addToCart - Function to add product to shopping cart (receives product & quantity)
 * @param {Function} props.addToFavorites - Function to add product to favorites/wishlist (receives product)
 */
const ProductDetails = ({ addToCart, addToFavorites }) => {
  // Extract the product ID from the URL parameter (e.g., /products/123 → id = "123")
  const { id } = useParams();
  
  // Hook for programmatic navigation (redirects, back button, etc.)
  const navigate = useNavigate();
  
  // State to store the full product object fetched from API
  // Initialized to null - page shows loading spinner until data arrives
  const [product, setProduct] = useState(null);
  
  // Loading state to control spinner visibility during API calls
  const [loading, setLoading] = useState(true);
  
  // Quantity selector state - defaults to 1, user can increase/decrease
  const [quantity, setQuantity] = useState(1);
  
  // State to store AI-recommended related products
  const [recommendations, setRecommendations] = useState([]);
  
  // Toast notification states for user feedback
  const [addedToCart, setAddedToCart] = useState(false);    // Shows "Added to cart!" toast
  const [addedToFav, setAddedToFav] = useState(false);      // Shows "Added to favorites!" toast

  /**
   * useEffect: Fetch product data when component mounts or ID changes
   * Dependency: [id] - re-fetches if user navigates to a different product
   * This handles the case where user clicks a recommendation and the URL changes
   */
  useEffect(() => {
    fetchProduct(); // Fetch new product data when ID changes
  }, [id]);

  /**
   * Fetch product details from the backend API
   * Uses the product ID from URL params to get specific product
   * On success: updates product state and triggers recommendations fetch
   * On failure (404): redirects to products listing page
   * Always sets loading to false in finally block
   */
  const fetchProduct = async () => {
    try {
      // GET request to fetch single product by ID
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      
      if (response.ok) {
        // Parse the JSON response into a JavaScript object
        const data = await response.json();
        
        // Update product state with fetched data
        setProduct(data);
        
        // Fetch AI-powered product recommendations based on this product
        fetchRecommendations(data.id);
      } else {
        // Product not found or error - redirect to products listing page
        navigate("/products");
      }
    } catch (error) {
      // Network error or server unavailable
      console.error("Error fetching product:", error);
    } finally {
      // Always hide loading spinner, regardless of success or failure
      setLoading(false);
    }
  };

  /**
   * Fetch AI-powered product recommendations from the backend
   * Called after successfully loading the main product
   * 
   * @param {number|string} productId - The current product's ID to get recommendations for
   */
  const fetchRecommendations = async (productId) => {
    try {
      // GET request to AI recommendation engine
      const response = await fetch(`http://localhost:5000/api/recommendations/${productId}`);
      
      // Parse response into array of recommended products
      const data = await response.json();
      
      // Update recommendations state for rendering
      setRecommendations(data);
    } catch (error) {
      // Non-critical error - recommendations fail silently
      // Product page still works without recommendations
      console.error("Error fetching recommendations:", error);
    }
  };

  /**
   * Handle adding the current product to the shopping cart
   * Calls the addToCart function passed from App.js with product and selected quantity
   * Shows a temporary success toast notification (2 seconds)
   */
  const handleAddToCart = () => {
    if (product) {
      // Call parent function with product object and selected quantity
      addToCart(product, quantity);
      
      // Show success toast
      setAddedToCart(true);
      
      // Auto-hide toast after 2 seconds
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  /**
   * Handle adding the current product to favorites/wishlist
   * Calls the addToFavorites function passed from App.js
   * Shows a temporary success toast notification (2 seconds)
   */
  const handleAddToFavorites = () => {
    if (product) {
      // Call parent function with product object
      addToFavorites(product);
      
      // Show success toast
      setAddedToFav(true);
      
      // Auto-hide toast after 2 seconds
      setTimeout(() => setAddedToFav(false), 2000);
    }
  };

  /**
   * Process and validate image URLs from the product data
   * Handles various image path formats and provides fallbacks
   * 
   * @param {string} image - Raw image path from product data
   * @returns {string} - Processed, valid image URL
   * 
   * Cases handled:
   * 1. null/empty/"null" → Returns random placeholder from picsum
   * 2. "images/..." prefix → Prepends "/" for relative path resolution
   * 3. Full URLs → Returns as-is (e.g., https://...)
   */
  const getImageUrl = (image) => {
    // Case 1: Missing or invalid image - use placeholder
    if (!image || image === "" || image === "null") {
      return "https://picsum.photos/500x400?random=1";
    }
    // Case 2: Relative path starting with "images/" - add leading slash
    if (image.startsWith('images/')) {
      return `/${image}`;
    }
    // Case 3: Already a full URL or other valid path - return unchanged
    return image;
  };

  // ========================================
  // LOADING STATE
  // ========================================
  // Show full-screen spinner while product data is being fetched
  if (loading) {
    return (
      // Full viewport height with dark purple gradient background
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        {/* Centered loading content */}
        <div className="text-center">
          {/* Animated spinner circle */}
          {/*
            - w-16 h-16: 64px square
            - border-4: 4px border width
            - border-purple-500: Purple border color
            - border-t-transparent: Top border transparent (creates spinning effect)
            - rounded-full: Perfect circle
            - animate-spin: Continuous rotation animation
            - mx-auto: Center horizontally
            - mb-4: Bottom margin
          */}
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {/* Loading message */}
          <p className="text-white text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // NULL/ERROR STATE
  // ========================================
  // If product failed to load or is null, render nothing
  // The fetchProduct function handles navigation for 404 errors
  if (!product) return null;

  // Derived state: Check if product is on sale
  // Supports both numeric (1/0) and boolean (true/false) sale indicators
  const isOnSale = product.sale === 1 || product.sale === true;
  
  // Calculate sale price: 20% off the original price, formatted to 2 decimal places
  const salePrice = isOnSale ? (product.price * 0.8).toFixed(2) : null;
  
  // Derived state: Check if product is in stock
  const inStock = product.quantity > 0;

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    // Full page container with dark purple gradient background
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      {/* Content wrapper with max width constraint */}
      <div className="container mx-auto max-w-6xl">
        
        {/* ===== BACK BUTTON ===== */}
        {/* Navigates to the previous page in browser history */}
        <button 
          onClick={() => navigate(-1)} // -1 = go back one page in history
          className="group flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6"
        >
          {/* Arrow icon that slides left on hover (group-hover effect) */}
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        {/* ===== MAIN PRODUCT CARD ===== */}
        {/* Glass-morphism effect with backdrop blur and semi-transparent background */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
          {/* Two-column grid layout on medium screens and above */}
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            
            {/* ===== LEFT COLUMN: PRODUCT IMAGE ===== */}
            <div className="relative group">
              {/* Glow effect behind image - becomes more visible on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              
              {/* Product image with hover zoom effect */}
              <img 
                src={getImageUrl(product.image)} // Process image URL with fallback
                alt={product.name}               // Accessibility: descriptive alt text
                className="relative w-full rounded-2xl object-cover shadow-lg transform group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* ===== SALE BADGE ===== */}
              {/* Only shown when product is on sale */}
              {isOnSale && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                  🔥 SALE -20%
                </div>
              )}
            </div>

            {/* ===== RIGHT COLUMN: PRODUCT INFO ===== */}
            <div className="space-y-6">
              
              {/* Product name and status indicators */}
              <div>
                {/* Product name - responsive font size */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{product.name}</h1>
                
                {/* Status row: Stock status + Warranty info */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Stock availability indicator */}
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-400" />
                    <span className={`${inStock ? 'text-green-400' : 'text-red-400'} font-medium`}>
                      {inStock ? `In Stock (${product.quantity} available)` : "Out of Stock"}
                    </span>
                  </div>
                  
                  {/* Visual separator dot */}
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  
                  {/* Warranty information */}
                  <div className="flex items-center gap-1">
                    <FaShieldAlt className="text-blue-400" />
                    <span className="text-gray-300">1 Year Warranty</span>
                  </div>
                </div>
              </div>

              {/* ===== PRICE DISPLAY ===== */}
              <div className="bg-white/5 rounded-xl p-4">
                {isOnSale ? (
                  // Sale price layout: Original price (strikethrough) + Sale price + Save badge
                  <div className="flex items-baseline gap-3">
                    {/* Original price with strikethrough */}
                    <span className="text-gray-400 text-lg line-through">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    {/* Sale price in green, large font */}
                    <span className="text-green-400 text-4xl font-bold">${salePrice}</span>
                    {/* Save percentage badge */}
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                      Save 20%
                    </span>
                  </div>
                ) : (
                  // Regular price display
                  <span className="text-green-400 text-4xl font-bold">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                )}
              </div>

              {/* ===== QUANTITY SELECTOR ===== */}
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">Quantity:</span>
                
                {/* Quantity control group with semi-transparent background */}
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                  {/* Decrease quantity button */}
                  {/* Math.max(1, quantity - 1) ensures quantity never goes below 1 */}
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-red-500/50 transition-all flex items-center justify-center"
                  >
                    <FaMinus className="text-white" />
                  </button>
                  
                  {/* Quantity display - minimum 50px width for consistency */}
                  <span className="text-white font-bold text-xl min-w-[50px] text-center">
                    {quantity}
                  </span>
                  
                  {/* Increase quantity button */}
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-green-500/50 transition-all flex items-center justify-center"
                  >
                    <FaPlus className="text-white" />
                  </button>
                </div>
              </div>

              {/* ===== ACTION BUTTONS ===== */}
              <div className="flex gap-4">
                {/* Add to Cart button */}
                <button 
                  onClick={handleAddToCart} 
                  disabled={!inStock} // Disable if out of stock
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    inStock 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                      : 'bg-gray-600 cursor-not-allowed text-gray-300' // Disabled styling
                  }`}
                >
                  <FaShoppingCart />
                  {/* Dynamic button text based on state */}
                  {addedToCart 
                    ? 'Added!' 
                    : `Add ${quantity > 1 ? `${quantity} Items` : "to Cart"}`
                  }
                </button>
                
                {/* Add to Favorites button */}
                {/* Always enabled - can favorite even if out of stock (for future purchase) */}
                <button 
                  onClick={handleAddToFavorites} 
                  className="flex-1 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg flex items-center justify-center gap-2"
                >
                  <FaHeart />
                  {/* Dynamic text: "Added!" when just clicked, otherwise "Add to Favorites" */}
                  {addedToFav ? 'Added!' : 'Add to Favorites'}
                </button>
              </div>

              {/* ===== SHIPPING & GUARANTEE INFO ===== */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                {/* Free shipping info */}
                <div className="flex items-center gap-3 text-gray-300">
                  <FaTruck className="text-purple-400" />
                  <span>Free shipping on orders over $100</span>
                </div>
                {/* Money-back guarantee */}
                <div className="flex items-center gap-3 text-gray-300">
                  <FaShieldAlt className="text-purple-400" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== AI SENTIMENT ANALYZER SECTION ===== */}
        {/* Displays AI-powered analysis of product reviews/sentiment */}
        <div className="mt-8">
          <SentimentAnalyzer 
            productId={product.id}       // Pass product ID for review fetching
            productName={product.name}   // Pass product name for display
          />
        </div>

        {/* ===== AI RECOMMENDATIONS SECTION ===== */}
        {/* Only shown when there are recommendations available */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            {/* Section header with gradient text effect */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white inline-flex items-center gap-3">
                {/* Gradient text using background-clip - text appears as purple-blue gradient */}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🤖 You Might Also Like
                </span>
              </h2>
              {/* Decorative gradient line under heading */}
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
            </div>
            
            {/* Responsive grid for recommendation cards */}
            {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Map through recommendations and render ProductCard for each */}
              {recommendations.map(rec => (
                <ProductCard
                  key={rec.id}                          // Unique key for React's reconciliation
                  product={rec}                         // Recommended product data
                  addToCart={addToCart}                 // Pass addToCart function
                  addToFavorites={addToFavorites}       // Pass addToFavorites function
                  onClick={() => navigate(`/products/${rec.id}`)} // Navigate to product on click
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== TOAST NOTIFICATIONS ===== */}
      {/* Fixed position overlays that slide in from the right */}
      
      {/* Cart addition toast */}
      {addedToCart && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50">
          ✓ Added to cart!
        </div>
      )}
      
      {/* Favorites addition toast */}
      {addedToFav && (
        <div className="fixed bottom-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50">
          ❤️ Added to favorites!
        </div>
      )}

      {/* ===== INLINE ANIMATION STYLES ===== */}
      {/* CSS-in-JS for custom animations not available in Tailwind */}
      <style jsx>{`
        /* Slide-in animation for toast notifications */
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);  /* Start 100px to the right */
          }
          to {
            opacity: 1;
            transform: translateX(0);      /* End at natural position */
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;  /* 300ms smooth entrance */
        }
        
        /* Pulse animation for sale badge */
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);           /* Normal size */
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.05);        /* Slightly larger at midpoint */
          }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;  /* Continuous gentle pulse */
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;