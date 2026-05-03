import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaPlus, FaMinus, FaShoppingBag, FaCreditCard, FaTruck, FaShieldAlt, FaArrowLeft, FaHeart } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const CartPage = ({ cart, removeFromCart, updateCartQuantity, addToFavorites }) => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [toastMessage, setToastMessage] = useState(null);
  
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  };

  const shippingCost = calculateSubtotal() > 100 ? 0 : 3.00;
  const tax = calculateSubtotal() * 0.1;
  const total = calculateSubtotal() + shippingCost + tax;

  const handleUpdateQuantity = async (itemId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    if (updateCartQuantity) {
      await updateCartQuantity(itemId, newQuantity);
    }
  };

  const handleAddToFavorites = async (item) => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      setToastMessage({ type: 'warning', text: 'Please login to add items to favorites' });
      setTimeout(() => setToastMessage(null), 3000);
      // Redirect to login page after 1 second
      setTimeout(() => navigate("/login"), 1000);
      return;
    }

    if (!addToFavorites) {
      setToastMessage({ type: 'error', text: 'Favorites service not available' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      await addToFavorites(item);
      setToastMessage({ type: 'success', text: '✓ Added to favorites!' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error("Error adding to favorites:", error);
      setToastMessage({ type: 'error', text: '✗ Failed to add to favorites' });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Group cart items by product_id to avoid duplicates
  const groupedCart = cart.reduce((acc, item) => {
    const existing = acc.find(i => i.product_id === item.product_id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  const displayCart = groupedCart.length > 0 ? groupedCart : cart;
  const totalItems = displayCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-slide-in-right ${
            toastMessage.type === 'success' 
              ? 'bg-green-500/90 border-green-400 text-white' 
              : toastMessage.type === 'warning'
              ? 'bg-yellow-500/90 border-yellow-400 text-white'
              : 'bg-red-500/90 border-red-400 text-white'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center gap-3 flex-wrap">
            <FaShoppingBag className="text-purple-400" />
            Your Shopping Cart
            <span className="text-lg bg-purple-500/20 px-3 py-1 rounded-full">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        {displayCart.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingBag className="text-purple-400 text-5xl" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Looks like you haven't added any items yet</p>
            <button 
              onClick={() => navigate("/products")}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {displayCart.map((item, index) => (
                <div
                  key={item.id || item.product_id || index}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:transform hover:-translate-y-1"
                >
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Product Image */}
                    <div className="relative w-full sm:w-40 h-40 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl overflow-hidden">
                      <img 
                        src={item.image || `https://picsum.photos/200/150?random=${item.product_id || item.id}`} 
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://picsum.photos/200/150?random=${item.product_id || item.id}`;
                        }}
                      />
                      <button
                        onClick={() => handleAddToFavorites({
                          id: item.product_id || item.id,
                          product_id: item.product_id || item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image
                        })}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-all duration-300 group/fav"
                        title={isAuthenticated ? "Add to favorites" : "Login to add to favorites"}
                      >
                        <FaHeart className="text-white text-sm group-hover/fav:scale-110 transition-transform" />
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.name}</h3>
                          <p className="text-purple-400 font-bold text-xl">
                            ${parseFloat(item.price).toFixed(2)}
                          </p>
                          <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            In Stock
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id || item.cart_item_id, item.quantity || 1, -1)}
                            className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-red-500/50 transition-all duration-200"
                          >
                            <FaMinus className="text-white text-sm" />
                          </button>
                          <span className="text-white font-semibold text-lg min-w-[40px] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id || item.cart_item_id, item.quantity || 1, 1)}
                            className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-green-500/50 transition-all duration-200"
                          >
                            <FaPlus className="text-white text-sm" />
                          </button>
                        </div>

                        {/* Subtotal & Remove */}
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                          <button 
                            onClick={() => removeFromCart(item.id || item.cart_item_id)}
                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mt-2 transition-colors group/remove"
                          >
                            <FaTrash size={12} className="group-hover/remove:scale-110 transition-transform" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaCreditCard className="text-purple-400" />
                  Order Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                      <FaTruck className="text-sm" />
                      Shipping
                    </span>
                    <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-300">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  {calculateSubtotal() < 100 && calculateSubtotal() > 0 && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 animate-pulse">
                      <p className="text-green-400 text-sm text-center">
                        🎉 Add ${(100 - calculateSubtotal()).toFixed(2)} more for FREE shipping!
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div className="flex justify-between text-white font-bold text-xl">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Including VAT and shipping</p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate("/checkout")}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  Proceed to Checkout
                  <FaCreditCard />
                </button>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-4 text-gray-400 text-xs">
                    <div className="flex items-center gap-1">
                      <FaShieldAlt className="text-green-400" />
                      Secure Checkout
                    </div>
                    <div className="flex items-center gap-1">
                      <FaTruck className="text-blue-400" />
                      Fast Delivery
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-4 flex justify-center gap-2">
                  <div className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">🔒 SSL Secure</div>
                  <div className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">💰 Money Back</div>
                  <div className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">✅ 24/7 Support</div>
                </div>
              </div>

              {/* Free Shipping Message */}
              {calculateSubtotal() < 100 && calculateSubtotal() > 0 && (
                <div className="mt-6 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-2xl border border-orange-500/30 p-6">
                  <h3 className="text-orange-400 font-bold mb-2">✨ Free Shipping Eligible</h3>
                  <p className="text-gray-300 text-sm">
                    Add ${(100 - calculateSubtotal()).toFixed(2)} more to qualify for FREE shipping!
                  </p>
                  <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((calculateSubtotal() / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
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
};

export default CartPage;