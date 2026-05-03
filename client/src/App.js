import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import OpenPage from "./pages/OpenPage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetails from "./pages/ProductDetails";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChatBot from "./components/ChatBot";
import AIUniversalAssistant from "./components/AIUniversalAssistant";
import "./styles/styles.css";

/* ---------------- Layout Wrapper ---------------- */
const Layout = ({
  cart,
  favorites,
  addToCart,
  addToFavorites,
  removeFromCart,
  removeFromFavorites,
  clearCart,
  fetchCart,
  fetchFavorites,
  updateCartQuantity
}) => {
  const location = useLocation();
  const hideLayout = location.pathname === "/";

  useEffect(() => {
    if (location.pathname !== "/") {
      fetchCart();
      fetchFavorites();
    }
  }, [location.pathname]);

  return (
    <>
      {!hideLayout && <Navbar cart={cart} favorites={favorites} />}
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<OpenPage />} />
        <Route path="/home" element={<HomePage addToCart={addToCart} addToFavorites={addToFavorites} />} />
        <Route path="/products" element={<ProductsPage addToCart={addToCart} addToFavorites={addToFavorites} />} />
        <Route path="/products/:id" element={<ProductDetails addToCart={addToCart} addToFavorites={addToFavorites} />} />
        <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateCartQuantity={updateCartQuantity} />} />
        <Route path="/favorites" element={<FavoritesPage favorites={favorites} removeFromFavorites={removeFromFavorites} addToCart={addToCart} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
      {!hideLayout && <Footer />}
      {!hideLayout && <ChatBot />}
      {!hideLayout && <AIUniversalAssistant addToCart={addToCart} addToFavorites={addToFavorites} />}
    </>
  );
};

/* ---------------- Main App ---------------- */
const AppContent = () => {
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const { user, token, isAuthenticated, logout } = useAuth();

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      } else if (res.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else if (res.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          product_id: product.id, 
          quantity: quantity
        })
      });

      if (res.ok) {
        await fetchCart();
      } else if (res.status === 401) {
        alert("Session expired. Please login again.");
        logout();
        window.location.href = "/login";
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    }
  };

  const updateCartQuantity = async (itemId, newQuantity) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const addToFavorites = async (product) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id })
      });

      if (res.ok) {
        await fetchFavorites();
      } else if (res.status === 401) {
        alert("Session expired. Please login again.");
        logout();
        window.location.href = "/login";
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add to favorites");
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      alert("Failed to add to favorites");
    }
  };

  const removeFromCart = async (itemId) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const removeFromFavorites = async (productId) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/favorites/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchFavorites();
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCart([]);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
      fetchFavorites();
    } else {
      setCart([]);
      setFavorites([]);
    }
  }, [token]);

  return (
    <Layout
      cart={cart}
      favorites={favorites}
      addToCart={addToCart}
      addToFavorites={addToFavorites}
      removeFromCart={removeFromCart}
      removeFromFavorites={removeFromFavorites}
      clearCart={clearCart}
      fetchCart={fetchCart}
      fetchFavorites={fetchFavorites}
      updateCartQuantity={updateCartQuantity}
    />
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;