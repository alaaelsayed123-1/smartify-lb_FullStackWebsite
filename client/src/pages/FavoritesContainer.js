// Import React core and hooks for state management and side effects
import React, { useState, useEffect } from "react";
// Import axios for HTTP requests (with better API than fetch)
import axios from "axios";
// Import the presentational component that renders the favorites UI
import FavoritesPage from "./FavoritesPage";
// Import heart icon from react-icons library
import { FaHeart } from "react-icons/fa";

/**
 * FavoritesContainer Component
 * Acts as a container/smart component that:
 * - Fetches user's favorites from the API
 * - Manages favorites state and loading state
 * - Handles removing items from favorites
 * - Passes data and handlers down to the presentational FavoritesPage component
 * 
 * @param {Object} props
 * @param {Function} props.addToCart - Callback function to add an item to the shopping cart
 */
const FavoritesContainer = ({ addToCart }) => {
  // State to store the array of favorite items
  const [favorites, setFavorites] = useState([]);
  
  // Loading state to show spinner while fetching data
  const [loading, setLoading] = useState(true);
  
  // Get JWT token from localStorage for API authentication
  // Returns null if user is not logged in
  const token = localStorage.getItem("token");

  // Axios configuration object with authorization header
  // This object is reused across all API calls to avoid repetition
  const axiosConfig = { 
    headers: { 
      Authorization: `Bearer ${token}` // Bearer token format for JWT authentication
    } 
  };

  /**
   * Fetch user's favorites from the backend API
   * Guards against unauthenticated users by checking token existence
   * Updates favorites state on success
   * Handles errors gracefully with console logging
   */
  const fetchFavorites = async () => {
    // Guard clause: if no token, user is not logged in
    // Set loading to false and return early (no API call needed)
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true); // Show loading spinner before API call
      
      // GET request to fetch all favorites for the authenticated user
      // The token in axiosConfig identifies which user's favorites to return
      const res = await axios.get("http://localhost:5000/api/favorites", axiosConfig);
      
      // Update favorites state with the response data (array of favorite items)
      setFavorites(res.data);
    } catch (err) {
      // Log error for debugging but don't crash the component
      // In production, you might want to show a user-friendly error message
      console.error("Error fetching favorites:", err);
    } finally {
      // Always set loading to false, whether the request succeeded or failed
      // This ensures the spinner disappears and content renders (or empty state)
      setLoading(false);
    }
  };

  /**
   * Remove an item from the user's favorites
   * Makes DELETE request to the API
   * Updates local state with the new favorites list returned by the server
   * 
   * @param {string|number} id - The ID of the favorite item to remove
   * @returns {Object} The API response object (for potential chaining)
   * @throws Will throw the error if removal fails (for parent error handling)
   */
  const removeFromFavorites = async (id) => {
    try {
      // DELETE request to remove a specific favorite by its ID
      // Server returns the updated favorites list after removal
      const res = await axios.delete(`http://localhost:5000/api/favorites/${id}`, axiosConfig);
      
      // Update local state with the new favorites list from server response
      // This ensures client state stays in sync with the database
      setFavorites(res.data);
      
      // Return the response for potential use by calling components
      return res;
    } catch (err) {
      // Log the error for debugging purposes
      console.error("Error removing favorite:", err);
      
      // Show user-friendly error message via alert
      // Note: In production, consider using a toast notification instead of alert()
      alert("Error removing from favorites");
      
      // Re-throw the error so parent components can also handle it if needed
      throw err;
    }
  };

  /**
   * useEffect to fetch favorites when component mounts or token changes
   * Dependencies: [token] - refetches if authentication state changes
   * This handles cases where user logs in/out during the session
   */
  useEffect(() => { 
    fetchFavorites(); 
  }, [token]); // Re-run effect when token changes (login/logout)

  /**
   * Loading State UI
   * Displayed while favorites are being fetched from the API
   * Features:
   * - Full-screen gradient background (red/dark theme)
   * - Animated spinning circle (border spinner)
   * - "Loading your favorites..." message
   */
  if (loading) {
    return (
      // Full viewport height container with gradient background
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        {/* Centered loading content */}
        <div className="text-center">
          {/* Animated spinner circle */}
          {/*
            - w-16 h-16: 64px width and height (square)
            - border-4: 4px border width
            - border-pink-500: Pink border color
            - border-t-transparent: Top border is transparent (creates the spinning effect)
            - rounded-full: Perfect circle shape
            - animate-spin: CSS animation for continuous rotation
            - mx-auto: Center horizontally
            - mb-4: Bottom margin for spacing
          */}
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          
          {/* Loading message text */}
          <p className="text-white text-lg">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  /**
   * Main Render
   * Passes data and handler functions down to the presentational FavoritesPage component
   * This separation of concerns:
   * - Container handles data fetching and state management
   * - Presentational component handles UI rendering
   */
  return (
    <FavoritesPage
      favorites={favorites}                  // Array of favorite items
      removeFromFavorites={removeFromFavorites} // Function to remove an item
      addToCart={addToCart}                  // Function to add item to cart (passed from parent)
    />
  );
};

export default FavoritesContainer;