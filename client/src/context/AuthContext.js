// Import necessary React hooks and utilities
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create an AuthContext to share authentication state across the app
const AuthContext = createContext();

// Custom hook to access auth context easily from any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Safety check: ensures hook is used within AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component that wraps the app and provides authentication state
export const AuthProvider = ({ children }) => {
  // State for storing the authenticated user object
  const [user, setUser] = useState(null);
  // Loading state to track if we're still checking localStorage for existing auth
  const [loading, setLoading] = useState(true);
  // State for storing the authentication token (JWT or similar)
  const [token, setToken] = useState(null);

  // Effect runs once on mount to check for existing authentication
  useEffect(() => {
    // Function to load user data from localStorage
    const loadUser = () => {
      try {
        // Retrieve stored token and user data from browser storage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('customer');
        
        // Check if storedUser exists and is not "undefined" string
        // This prevents errors from corrupted or invalid localStorage data
        if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          // Parse the JSON string back into an object
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        // If parsing fails (corrupted data), clean up localStorage
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('customer');
      } finally {
        // Whether successful or not, we're done loading
        setLoading(false);
      }
    };

    loadUser();
  }, []); // Empty dependency array means this runs once on mount

  // Login function to authenticate a user
  const login = (userData, authToken) => {
    if (userData && authToken) {
      // Update React state
      setUser(userData);
      setToken(authToken);
      // Persist authentication data to localStorage for session persistence
      localStorage.setItem('token', authToken);
      localStorage.setItem('customer', JSON.stringify(userData));
    }
  };

  // Logout function to clear authentication state
  const logout = () => {
    // Reset React state to null
    setUser(null);
    setToken(null);
    // Remove authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
  };

  // Update user function to modify user data (e.g., profile updates)
  const updateUser = (userData) => {
    if (userData) {
      // Update React state with new user data
      setUser(userData);
      // Persist updated user data to localStorage
      localStorage.setItem('customer', JSON.stringify(userData));
    }
  };

  // Provide authentication state and methods to all child components
  return (
    <AuthContext.Provider 
      value={{ 
        user,           // The authenticated user object
        token,          // The authentication token
        loading,        // Whether we're still loading auth state
        login,          // Function to log in
        logout,         // Function to log out
        updateUser,     // Function to update user data
        isAuthenticated: !!user && !!token  // Computed boolean for auth status
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the context as default for potential direct usage
export default AuthContext;