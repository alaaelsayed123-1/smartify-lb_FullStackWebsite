// ============================================================
// APP.JS - MAIN APPLICATION FILE (SMARTIFY LB)
// ============================================================
// This is the ROOT component of the entire application
// It serves as the SINGLE SOURCE OF TRUTH for:
// - All application state (cart, favorites)
// - All API communication functions
// - Route definitions and layout structure
// ============================================================

// Import React and necessary hooks
import React, { useState, useEffect } from "react";

// Import routing components from react-router-dom
import {
  BrowserRouter as Router,  // Renamed to Router for cleaner usage - manages browser history
  Routes,                    // Container for all Route definitions (v6 syntax)
  Route,                     // Defines a single route (path → component mapping)
  useLocation,               // Hook to access current URL location
  useNavigate                // Hook for programmatic navigation
} from "react-router-dom";

// Import authentication context
// AuthProvider: Wraps the app to provide auth state to all components
// useAuth: Hook to access auth state (user, token, isAuthenticated, logout)
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import layout components
import Navbar from "./components/Navbar";       // Top navigation bar
import Footer from "./components/Footer";       // Bottom footer section
import ChatBot from "./components/ChatBot";     // Customer support chat widget
import AIUniversalAssistant from "./components/AIUniversalAssistant"; // AI shopping assistant

// Import all page components
import AdminLogin from "./pages/AdminLogin";           // Admin authentication page
import AdminPage from "./pages/AdminPage";             // Admin dashboard
import OpenPage from "./pages/OpenPage";               // Landing/splash page
import HomePage from "./pages/HomePage";               // Main store homepage
import ProductsPage from "./pages/ProductsPage";       // Products listing page
import ProductDetails from "./pages/ProductDetails";   // Single product details page
import CartPage from "./pages/CartPage";               // Shopping cart page
import FavoritesPage from "./pages/FavoritesPage";     // Wishlist/favorites page
import AboutPage from "./pages/AboutPage";             // About us page
import CheckoutPage from "./pages/CheckoutPage";       // Checkout/payment page
import LoginPage from "./pages/LoginPage";             // User login page
import SignupPage from "./pages/SignupPage";           // User registration page
import ForgotPasswordPage from "./pages/ForgotPasswordPage"; // Password recovery page
import Contact from "./pages/Contact";                 // Contact us page

// Import global styles
import "./styles/styles.css";

// ============================================================
// LAYOUT COMPONENT - The Distributor
// ============================================================
// This component receives ALL props from AppContent and 
// distributes them to the appropriate pages/routes
// 
// Props received from AppContent (THE SOURCE):
// - cart, favorites: State arrays
// - addToCart, addToFavorites: Functions to add items
// - removeFromCart, removeFromFavorites: Functions to remove items
// - clearCart: Function to empty the cart
// - fetchCart, fetchFavorites: Functions to refresh data from server
// - updateCartQuantity: Function to change item quantity
// ============================================================
const Layout = ({
  cart,                    // Array of cart items (passed to Navbar & CartPage)
  favorites,               // Array of favorite items (passed to Navbar & FavoritesPage)
  addToCart,              // Function to add product to cart (passed to multiple pages)
  addToFavorites,         // Function to add product to favorites (passed to multiple pages)
  removeFromCart,         // Function to remove item from cart (passed to CartPage)
  removeFromFavorites,    // Function to remove item from favorites (passed to FavoritesPage)
  clearCart,              // Function to empty entire cart (passed to CartPage & CheckoutPage)
  fetchCart,              // Function to refresh cart from server (called on page change)
  fetchFavorites,         // Function to refresh favorites from server (called on page change)
  updateCartQuantity      // Function to change item quantity (passed to CartPage)
}) => {
  
  // Get current URL location (e.g., "/home", "/products", "/cart")
  const location = useLocation();
  
  // Determine if we should hide the layout (Navbar, Footer, ChatBot)
  // Only hide on the root path "/" which shows the splash/landing page
  const hideLayout = location.pathname === "/";

  // ========================================
  // EFFECT: Fetch cart and favorites data
  // ========================================
  // Runs every time the URL path changes
  // Skips fetching on the splash page ("/")
  // This ensures data is fresh when navigating between pages
  // ========================================
  useEffect(() => {
    // Don't fetch data on the splash/landing page
    if (location.pathname !== "/") {
      fetchCart();       // Refresh cart from server
      fetchFavorites();  // Refresh favorites from server
    }
    // Dependencies: re-run when pathname changes
  }, [location.pathname]);

  // ========================================
  // RENDER: Layout Structure
  // ========================================
  return (
    <>
      {/* NAVBAR - Only show on non-splash pages */}
      {/* Pass cart and favorites for the badge counters (e.g., 🛒 3, ❤️ 2) */}
      {!hideLayout && <Navbar cart={cart} favorites={favorites} />}
      
      {/* ROUTES - Define all application routes */}
      <Routes>
        {/* ===== ADMIN ROUTES ===== */}
        {/* Admin login page - no props needed (uses AuthContext) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        {/* Admin dashboard - no props needed */}
        <Route path="/admin/dashboard" element={<AdminPage />} />
        {/* Admin default redirect */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* ===== PUBLIC ROUTES ===== */}
        {/* Splash/landing page - shown at root URL */}
        <Route path="/" element={<OpenPage />} />
        
        {/* ===== MAIN STORE ROUTES ===== */}
        {/* Homepage - receives addToCart and addToFavorites */}
        {/* These are passed THROUGH to ProductCard components in the AI recommendations section */}
        <Route path="/home" element={
          <HomePage 
            addToCart={addToCart}             // Pass function for product cards
            addToFavorites={addToFavorites}   // Pass function for product cards
          />} 
        />
        
        {/* Products listing page - receives same functions for all product cards */}
        <Route path="/products" element={
          <ProductsPage 
            addToCart={addToCart}             // Pass function for each product card
            addToFavorites={addToFavorites}   // Pass function for each product card
          />} 
        />
        
        {/* Single product details page - receives functions for direct use */}
        {/* :id is a URL parameter (e.g., /products/123) */}
        <Route path="/products/:id" element={
          <ProductDetails 
            addToCart={addToCart}             // Used directly on "Add to Cart" button
            addToFavorites={addToFavorites}   // Used directly on "Add to Favorites" button
          />} 
        />
        
        {/* Shopping cart page - receives cart data and modification functions */}
        <Route path="/cart" element={
          <CartPage 
            cart={cart}                           // All items in cart
            removeFromCart={removeFromCart}       // Remove single item
            clearCart={clearCart}                 // Empty entire cart
            updateCartQuantity={updateCartQuantity} // Change item quantity (+/- buttons)
          />} 
        />
        
        {/* Favorites/wishlist page */}
        <Route path="/favorites" element={
          <FavoritesPage 
            favorites={favorites}                   // All favorite items
            removeFromFavorites={removeFromFavorites} // Remove from favorites
            addToCart={addToCart}                   // Move from favorites to cart
          />} 
        />
        
        {/* Checkout page - receives cart summary and clear function */}
        <Route path="/checkout" element={
          <CheckoutPage 
            cart={cart}         // Show order summary before payment
            clearCart={clearCart} // Clear cart after successful order
          />} 
        />
        
        {/* ===== STATIC PAGES ===== */}
        {/* About page - no props needed (static content) */}
        <Route path="/about" element={<AboutPage />} />
        
        {/* ===== AUTH PAGES ===== */}
        {/* Login page - no props needed (uses AuthContext) */}
        <Route path="/login" element={<LoginPage />} />
        {/* Signup page - no props needed (uses AuthContext) */}
        <Route path="/signup" element={<SignupPage />} />
        {/* Forgot password page - no props needed */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* ===== OTHER PAGES ===== */}
        {/* Contact page - no props needed (static form) */}
        <Route path="/contact" element={<Contact />} />
      </Routes>
      
      {/* FOOTER - Only show on non-splash pages */}
      {!hideLayout && <Footer />}
      
      {/* CHATBOT - Customer support widget - Only on non-splash pages */}
      {!hideLayout && <ChatBot />}
      
      {/* AI ASSISTANT - Shopping assistant - Only on non-splash pages */}
      {/* Receives functions to add items directly from chat suggestions */}
      {!hideLayout && <AIUniversalAssistant 
        addToCart={addToCart}             // AI can suggest and add to cart
        addToFavorites={addToFavorites}   // AI can suggest and add to favorites
      />}
    </>
  );
};

// ============================================================
// APP CONTENT COMPONENT - The Brain / Single Source of Truth
// ============================================================
// This is where ALL state and functions are defined
// It communicates with the backend API
// It passes everything down to Layout for distribution
// 
// Think of this as the "owner" or "father" component
// All data flows FROM here TO the rest of the app
// ============================================================
const AppContent = () => {
  
  // ========================================
  // STATE DEFINITIONS
  // ========================================
  // cart: Array of cart items fetched from backend
  // Each item contains: { id, product_id, quantity, product: { name, price, image, ... } }
  const [cart, setCart] = useState([]);
  
  // favorites: Array of favorite/wishlist items fetched from backend
  // Each item contains: { id, product_id, product: { name, price, image, ... } }
  const [favorites, setFavorites] = useState([]);
  
  // Destructure authentication data from AuthContext
  // user: Current user object (null if not logged in)
  // token: JWT token for API authorization
  // isAuthenticated: Boolean - is user logged in?
  // logout: Function to log out and clear auth state
  const { user, token, isAuthenticated, logout } = useAuth();

  // ============================================================
  // FUNCTION: fetchCart
  // ============================================================
  // Purpose: Fetch all cart items from the backend server
  // When called: On page navigation (via Layout useEffect) and after cart modifications
  // Returns: Updates the cart state with fresh data from server
  // ============================================================
  const fetchCart = async () => {
    // Guard: Don't attempt fetch if no token (user not logged in)
    if (!token) return;
    
    try {
      // Send GET request to cart API endpoint
      const res = await fetch("http://localhost:5000/api/cart", {
        headers: { 
          Authorization: `Bearer ${token}`  // JWT token for authentication
        }
      });
      
      // If request successful, update cart state
      if (res.ok) {
        const data = await res.json();  // Parse JSON response
        setCart(data);                   // Update React state → triggers re-render
      } 
      // If unauthorized (token expired), force logout
      else if (res.status === 401) {
        logout();  // Clear auth state and redirect to login
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // ============================================================
  // FUNCTION: fetchFavorites
  // ============================================================
  // Purpose: Fetch all favorite/wishlist items from the backend server
  // When called: On page navigation and after favorite modifications
  // Returns: Updates the favorites state with fresh data from server
  // ============================================================
  const fetchFavorites = async () => {
    // Guard: Don't attempt fetch if no token
    if (!token) return;
    
    try {
      // Send GET request to favorites API endpoint
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { 
          Authorization: `Bearer ${token}`  // JWT token for authentication
        }
      });
      
      // If request successful, update favorites state
      if (res.ok) {
        const data = await res.json();  // Parse JSON response
        setFavorites(data);             // Update React state → triggers re-render
      } 
      // If unauthorized, force logout
      else if (res.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // ============================================================
  // FUNCTION: addToCart
  // ============================================================
  // Purpose: Add a product to the shopping cart
  // Parameters:
  //   - product: The product object to add (must have product.id)
  //   - quantity: Number of items to add (default: 1)
  // When called: When user clicks "Add to Cart" button anywhere in the app
  // Flow: Check auth → Send POST to server → Refresh cart state
  // ============================================================
  const addToCart = async (product, quantity = 1) => {
    // Guard: Redirect to login if user is not authenticated
    if (!isAuthenticated) {
      window.location.href = "/login";  // Hard redirect to login page
      return;                           // Stop execution
    }

    try {
      // Send POST request to add item to cart
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "POST",                  // POST = Create new resource
        headers: {
          "Content-Type": "application/json",  // Sending JSON data
          Authorization: `Bearer ${token}`      // Auth token
        },
        body: JSON.stringify({ 
          product_id: product.id,   // Which product to add
          quantity: quantity         // How many to add (default 1)
        })
      });

      // Handle different response scenarios
      if (res.ok) {
        // SUCCESS: Product added to cart
        await fetchCart();  // Refresh cart to get updated list from server
      } 
      else if (res.status === 401) {
        // SESSION EXPIRED: Token is invalid
        alert("Session expired. Please login again.");
        logout();                          // Clear auth state
        window.location.href = "/login";   // Redirect to login
      } 
      else {
        // OTHER ERROR: Server returned an error message
        const data = await res.json();
        alert(data.message || "Failed to add to cart");
      }
    } catch (error) {
      // NETWORK ERROR: Could not connect to server
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    }
  };

  // ============================================================
  // FUNCTION: updateCartQuantity
  // ============================================================
  // Purpose: Change the quantity of an item already in the cart
  // Parameters:
  //   - itemId: The cart item ID to update
  //   - newQuantity: The new quantity value
  // When called: When user clicks +/- buttons in CartPage
  // ============================================================
  const updateCartQuantity = async (itemId, newQuantity) => {
    // Guard: Don't attempt if no token
    if (!token) return;
    
    try {
      // Send PUT request to update specific cart item
      const res = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "PUT",                   // PUT = Update existing resource
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          quantity: newQuantity          // New quantity value
        })
      });
      
      // If successful, refresh cart from server
      if (res.ok) {
        await fetchCart();  // Get updated cart with new quantities
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  // ============================================================
  // FUNCTION: addToFavorites
  // ============================================================
  // Purpose: Add a product to the favorites/wishlist
  // Parameters:
  //   - product: The product object to add (must have product.id)
  // When called: When user clicks "Add to Favorites" or heart icon
  // Flow: Check auth → Send POST to server → Refresh favorites state
  // ============================================================
  const addToFavorites = async (product) => {
    // Guard: Redirect to login if not authenticated
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      // Send POST request to add item to favorites
      const res = await fetch("http://localhost:5000/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          product_id: product.id  // Which product to favorite
        })
      });

      // Handle response scenarios
      if (res.ok) {
        // SUCCESS: Product favorited
        await fetchFavorites();  // Refresh favorites list
      } 
      else if (res.status === 401) {
        // SESSION EXPIRED
        alert("Session expired. Please login again.");
        logout();
        window.location.href = "/login";
      } 
      else {
        // OTHER ERROR
        const data = await res.json();
        alert(data.message || "Failed to add to favorites");
      }
    } catch (error) {
      // NETWORK ERROR
      console.error("Error adding to favorites:", error);
      alert("Failed to add to favorites");
    }
  };

  // ============================================================
  // FUNCTION: removeFromCart
  // ============================================================
  // Purpose: Remove a single item from the shopping cart
  // Parameters:
  //   - itemId: The cart item ID to remove
  // When called: When user clicks "Remove" or trash icon in CartPage
  // ============================================================
  const removeFromCart = async (itemId) => {
    // Guard: Don't attempt if no token
    if (!token) return;
    
    try {
      // Send DELETE request for specific cart item
      const res = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "DELETE",                 // DELETE = Remove resource
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      // If successful, refresh cart from server
      if (res.ok) {
        await fetchCart();  // Get updated cart without the removed item
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // ============================================================
  // FUNCTION: removeFromFavorites
  // ============================================================
  // Purpose: Remove a product from favorites/wishlist
  // Parameters:
  //   - productId: The product ID to remove from favorites
  // When called: When user clicks heart icon again or remove button
  // ============================================================
  const removeFromFavorites = async (productId) => {
    // Guard: Don't attempt if no token
    if (!token) return;
    
    try {
      // Send DELETE request for specific favorite item
      const res = await fetch(`http://localhost:5000/api/favorites/${productId}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      // If successful, refresh favorites from server
      if (res.ok) {
        await fetchFavorites();  // Get updated favorites without removed item
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  // ============================================================
  // FUNCTION: clearCart
  // ============================================================
  // Purpose: Remove ALL items from the shopping cart
  // When called: After successful checkout, or when user clicks "Clear Cart"
  // Note: This empties the entire cart, not just one item
  // ============================================================
  const clearCart = async () => {
    // Guard: Don't attempt if no token
    if (!token) return;
    
    try {
      // Send DELETE request to cart endpoint (no item ID = clear all)
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "DELETE",                 // DELETE without ID = clear all
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      // If successful, reset cart to empty array
      if (res.ok) {
        setCart([]);  // Clear local state immediately (no need to re-fetch)
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // ============================================================
  // EFFECT: Initialize data when token changes
  // ============================================================
  // Runs when the token changes (login, logout, or app start)
  // If token exists: Fetch cart and favorites from server
  // If no token: Reset both to empty arrays
  // ============================================================
  useEffect(() => {
    if (token) {
      // User is logged in (or just logged in)
      fetchCart();        // Load cart from server
      fetchFavorites();   // Load favorites from server
    } else {
      // User is logged out (or not logged in)
      setCart([]);        // Clear cart state
      setFavorites([]);   // Clear favorites state
    }
    // Dependencies: re-run when token changes
  }, [token]);

  // ========================================
  // RENDER: Pass everything to Layout
  // ========================================
  // Layout acts as the distributor - it receives ALL state and functions
  // and passes them to the appropriate pages via Routes
  // ========================================
  return (
    <Layout
      // ===== STATE DATA =====
      cart={cart}                               // Cart items array
      favorites={favorites}                     // Favorites items array
      
      // ===== ADD FUNCTIONS =====
      addToCart={addToCart}                     // Add item to cart
      addToFavorites={addToFavorites}           // Add item to favorites
      
      // ===== REMOVE FUNCTIONS =====
      removeFromCart={removeFromCart}           // Remove single item from cart
      removeFromFavorites={removeFromFavorites} // Remove single item from favorites
      
      // ===== CART MANAGEMENT FUNCTIONS =====
      clearCart={clearCart}                     // Empty entire cart
      updateCartQuantity={updateCartQuantity}   // Change item quantity
      
      // ===== DATA FETCHING FUNCTIONS =====
      fetchCart={fetchCart}                     // Refresh cart from server
      fetchFavorites={fetchFavorites}           // Refresh favorites from server
    />
  );
};

// ============================================================
// APP COMPONENT - The Outer Shell
// ============================================================
// This is the top-level component that wraps everything
// It sets up:
// 1. Router: For navigation and URL management
// 2. AuthProvider: For authentication state management
// 3. AppContent: The actual application logic
// ============================================================
const App = () => {
  return (
    <Router>
      {/* Router: Enables client-side routing (URL changes without page reload) */}
      
      <AuthProvider>
        {/* AuthProvider: Provides authentication context to ALL child components */}
        {/* Any component can use useAuth() to access: user, token, isAuthenticated, logout */}
        
        <AppContent />
        {/* AppContent: The core application with all state and logic */}
      </AuthProvider>
    </Router>
  );
};

// Export the App component as the default export
// This is imported in index.js and rendered to the DOM
export default App;