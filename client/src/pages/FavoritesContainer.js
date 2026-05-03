import React, { useState, useEffect } from "react";
import axios from "axios";
import FavoritesPage from "./FavoritesPage";
import { FaHeart } from "react-icons/fa";

const FavoritesContainer = ({ addToCart }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchFavorites = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/favorites", axiosConfig);
      setFavorites(res.data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/favorites/${id}`, axiosConfig);
      setFavorites(res.data);
      return res;
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("Error removing from favorites");
      throw err;
    }
  };

  useEffect(() => { fetchFavorites(); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <FavoritesPage
      favorites={favorites}
      removeFromFavorites={removeFromFavorites}
      addToCart={addToCart}
    />
  );
};

export default FavoritesContainer;