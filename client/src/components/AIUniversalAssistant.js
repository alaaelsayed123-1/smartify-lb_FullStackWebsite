import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaCommentDots, FaSpinner, FaUser, FaShoppingCart, FaHeart, FaStar, FaTags, FaTruck, FaCreditCard, FaUndo } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const AIUniversalAssistant = ({ addToCart, addToFavorites }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "👋 **Hello! I'm SmartAI - Your Universal Shopping Assistant!**\n\nI can help you with:\n• 🔍 **Find products** - \"Find laptop under $500\"\n• 📦 **Order tracking** - \"Where's my order?\"\n• 💰 **Pricing & Sales** - \"Any discounts?\"\n• 📝 **Product advice** - \"Best phone for gaming?\"\n• 🚚 **Shipping info** - \"Delivery time?\"\n• 🔄 **Returns policy** - \"How to return?\"\n• ❤️ **Favorites** - \"Show my favorites\"\n\n💡 **Try asking anything!**", 
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const messagesEndRef = useRef(null);
  const { token, user, isAuthenticated } = useAuth();

  useEffect(() => {
    scrollToBottom();
    if (isAuthenticated && token) {
      fetchUserOrders();
      fetchUserFavorites();
    }
  }, [messages, isAuthenticated, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const searchProducts = async (criteria) => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const products = await response.json();
      
      let filtered = products.filter(p => p.quantity > 0);
      
      if (criteria.minPrice) {
        filtered = filtered.filter(p => p.price >= criteria.minPrice);
      }
      if (criteria.maxPrice) {
        filtered = filtered.filter(p => p.price <= criteria.maxPrice);
      }
      
      if (criteria.category) {
        const categoryKeywords = {
          laptop: ['laptop', 'computer', 'notebook', 'pc', 'lenovo', 'core'],
          phone: ['phone', 'iphone', 'galaxy', 'smartphone', 's25', 'z6'],
          watch: ['watch', 'smartwatch', 'apple watch', 'ultra'],
          headphones: ['headphone', 'earphone', 'airpod', 'microphone', 'audio'],
          speaker: ['speaker', 'bluetooth', 'sound'],
          tablet: ['tablet', 'ipad'],
          charger: ['charger', 'power', 'adapter', 'cable'],
          accessory: ['case', 'cover', 'protector']
        };
        
        const keywords = categoryKeywords[criteria.category] || [criteria.category];
        filtered = filtered.filter(p => 
          keywords.some(k => p.name.toLowerCase().includes(k))
        );
      }
      
      if (criteria.saleOnly) {
        filtered = filtered.filter(p => p.sale === 1 || p.sale === true);
      }
      
      if (criteria.searchTerm) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(criteria.searchTerm.toLowerCase())
        );
      }
      
      const scored = filtered.map(p => {
        let score = 0;
        if (criteria.budget && p.price <= criteria.budget) score += 30;
        if (p.sale) score += 20;
        if (p.quantity > 20) score += 10;
        return { ...p, score };
      });
      
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 6);
      
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  };

  const getOrderStatus = (orderNumber) => {
    const order = userOrders.find(o => o.order_number === orderNumber);
    if (order) {
      const statusMap = {
        pending: "⏳ Processing - We're preparing your order",
        processing: "📦 Packing - Your order is being packed",
        shipped: "🚚 Shipped - On its way to you!",
        delivered: "✅ Delivered - Enjoy your purchase!",
        cancelled: "❌ Cancelled - Order was cancelled"
      };
      return statusMap[order.order_status] || `Status: ${order.order_status}`;
    }
    return null;
  };

  const analyzeAndRespond = async (message) => {
    const msg = message.toLowerCase();
    
    // 1. CHECK ORDER STATUS
    const orderMatch = msg.match(/(?:order|#|ORD-)?\s*([A-Z0-9\-]{10,})/i);
    if (orderMatch && (msg.includes('order') || msg.includes('status') || msg.includes('where'))) {
      const orderNumber = orderMatch[1];
      const status = getOrderStatus(orderNumber);
      if (status) {
        return {
          text: `📦 **Order ${orderNumber}**: ${status}\n\nNeed more help? I can also help you track your order or answer questions about delivery!`,
          products: []
        };
      } else if (userOrders.length > 0) {
        return {
          text: `I couldn't find order ${orderNumber}. Here are your recent orders:\n\n${userOrders.map(o => `• **${o.order_number}** - ${o.order_status} - $${o.total_amount}`).join('\n')}\n\nWhich order would you like to track?`,
          products: []
        };
      } else {
        return {
          text: `I couldn't find that order. If you've placed an order, please make sure you're logged in. Need help? Contact support@smartify.com`,
          products: []
        };
      }
    }
    
    // 2. CHECK FAVORITES
    if (msg.includes('favorite') || msg.includes('saved') || (msg.includes('my') && msg.includes('liked'))) {
      if (userFavorites.length > 0) {
        return {
          text: `❤️ **Your Favorites (${userFavorites.length} items)**\n\nHere are the products you've saved. Click any to view details or add to cart!`,
          products: userFavorites
        };
      } else {
        return {
          text: `You don't have any favorites yet. Start adding products you love by clicking the ❤️ button on any product!`,
          products: []
        };
      }
    }
    
    // 3. CHECK ORDERS
    if (msg.includes('my order') || (msg.includes('my') && msg.includes('orders'))) {
      if (userOrders.length > 0) {
        return {
          text: `📋 **Your Recent Orders (${userOrders.length})**\n\n${userOrders.map(o => `• **${o.order_number}** - ${o.order_status} - $${o.total_amount} (${new Date(o.created_at).toLocaleDateString()})`).join('\n')}\n\nWant to track a specific order? Tell me the order number!`,
          products: []
        };
      } else {
        return {
          text: `You haven't placed any orders yet. Ready to shop? I can help you find the perfect products! 🛍️`,
          products: []
        };
      }
    }
    
    // 4. SHIPPING INFO
    if (msg.includes('shipping') || msg.includes('delivery') || msg.includes('ship')) {
      return {
        text: `🚚 **Shipping Information**\n\n• **Express Delivery**: 2-3 working days - $3.00\n• **Free Shipping**: On orders over $500\n• **Tracking**: You'll receive a tracking number via email once shipped\n\nNeed to track an order? Give me your order number!`,
        products: []
      };
    }
    
    // 5. RETURNS & REFUNDS
    if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
      return {
        text: `🔄 **Returns & Refunds**\n\n• **Return Window**: 14 days from delivery\n• **Condition**: Items must be unused and in original packaging\n• **Refund Time**: 5-7 business days after we receive the item\n• **How to Return**: Contact support@smartify.com with your order number\n\nNeed help with a specific order? I can help track it!`,
        products: []
      };
    }
    
    // 6. PAYMENT METHODS
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('cod') || msg.includes('cash')) {
      return {
        text: `💳 **Payment Methods**\n\nWe accept:\n• 💵 Cash on Delivery (COD)\n• 💳 Whish Pay\n• 📱 WPAY\n\nAll payments are secure and encrypted! 🔒`,
        products: []
      };
    }
    
    // 7. PRODUCT RECOMMENDATIONS - BUDGET BASED
    let budget = null;
    let category = null;
    let saleOnly = false;
    let feature = null;
    
    const budgetMatch = msg.match(/(?:under|below|less than|budget|max)\s*\$?(\d+)/);
    if (budgetMatch) budget = parseInt(budgetMatch[1]);
    
    const categories = ['laptop', 'phone', 'watch', 'headphone', 'speaker', 'tablet', 'charger', 'accessory'];
    for (const cat of categories) {
      if (msg.includes(cat)) {
        category = cat;
        break;
      }
    }
    
    if (msg.includes('sale') || msg.includes('discount') || msg.includes('deal')) saleOnly = true;
    
    if (msg.includes('gaming')) feature = 'gaming';
    if (msg.includes('music')) feature = 'music';
    if (msg.includes('work')) feature = 'work';
    if (msg.includes('fitness')) feature = 'fitness';
    
    let products = [];
    if (budget || category || saleOnly || feature) {
      products = await searchProducts({ 
        budget, 
        category, 
        saleOnly, 
        maxPrice: budget,
        minPrice: msg.includes('over') || msg.includes('above') ? budget : null,
        searchTerm: msg
      });
    }
    
    if (products.length > 0) {
      let responseText = "";
      if (budget) {
        responseText = `🎯 **Found ${products.length} great ${category || 'product'} option${products.length !== 1 ? 's' : ''} under $${budget}!**\n\n`;
      } else if (saleOnly) {
        responseText = `🔥 **Hot Deals! Here are ${products.length} items on sale:**\n\n`;
      } else if (category) {
        responseText = `📱 **Here are the best ${category}${feature ? ` for ${feature}` : ''}s we recommend:**\n\n`;
      } else {
        responseText = `✨ **Here are some products you might like:**\n\n`;
      }
      
      if (feature === 'gaming') responseText += `🎮 **For gaming**, look for high-performance products with fast processors and great graphics!\n\n`;
      if (feature === 'music') responseText += `🎵 **For music**, focus on audio quality and comfort. Check these out:\n\n`;
      if (feature === 'work') responseText += `💼 **Perfect for work** - these products offer great productivity features:\n\n`;
      
      return { text: responseText, products };
    }
    
    // 8. GREETINGS
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      const name = user?.first_name ? user.first_name : 'there';
      return {
        text: `👋 **Hello ${name}!** Welcome to Smartify AI Assistant!\n\nI can help you with:\n• 🔍 Finding products\n• 📦 Tracking orders\n• 💰 Checking prices\n• 🚚 Shipping info\n• 🔄 Returns\n\nWhat would you like to know today?`,
        products: []
      };
    }
    
    // 9. PRICE CHECK
    if (msg.includes('price') && !budget) {
      return {
        text: `💰 **Need price information?**\n\nTry asking:\n• "Find laptop under $500"\n• "What's the price of iPhone?"\n• "Show me products on sale"\n\nOr tell me what you're looking for and your budget!`,
        products: []
      };
    }
    
    // 10. GENERAL HELP
    return {
      text: `🤖 **I'm here to help!**\n\nHere's what I can do:\n\n🔍 **Find Products**\n• "Find laptop under $500"\n• "Best gaming phone"\n• "Headphones on sale"\n\n📦 **Order Help**\n• "Track my order"\n• "Where's order ORD-12345?"\n• "My recent orders"\n\n❤️ **Favorites**\n• "Show my favorites"\n• "What I liked"\n\n📋 **General Info**\n• "Shipping time?"\n• "Return policy"\n• "Payment methods"\n\nWhat would you like to know?`,
      products: []
    };
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setMessages(prev => [...prev, { 
      text: userMessage, 
      sender: "user", 
      timestamp: new Date() 
    }]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await analyzeAndRespond(userMessage);
      
      setMessages(prev => [...prev, { 
        text: response.text, 
        sender: "bot", 
        products: response.products,
        timestamp: new Date() 
      }]);
      
      if (response.products && response.products.length > 0) {
        setRecommendations(response.products);
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        text: "😅 I'm having trouble right now. Please try again or contact our support team at support@smartify.com", 
        sender: "bot",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleProductClick = (product) => {
    window.location.href = `/products/${product.id}`;
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (addToCart) addToCart(product);
    setMessages(prev => [...prev, {
      text: `✅ **Added ${product.name} to your cart!**\n\nWould you like to checkout or continue shopping?`,
      sender: "bot",
      timestamp: new Date()
    }]);
  };

  const handleAddToFavorites = (product, e) => {
    e.stopPropagation();
    if (addToFavorites) addToFavorites(product);
    setMessages(prev => [...prev, {
      text: `❤️ **Added ${product.name} to your favorites!**\n\nYou can view it anytime in your Favorites page.`,
      sender: "bot",
      timestamp: new Date()
    }]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",
          zIndex: 1000,
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          animation: "pulse 2s infinite"
        }}
        onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
      >
        <FaRobot size={32} />
        <div style={{
          position: "absolute",
          top: "-5px",
          right: "-5px",
          width: "22px",
          height: "22px",
          background: "#ff416c",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold"
        }}>
          AI
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "480px",
          height: "700px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1001,
          overflow: "hidden",
          animation: "slideUp 0.3s ease"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                padding: "8px"
              }}>
                <FaRobot size={24} />
              </div>
              <div>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>SmartAI Assistant</span>
                <p style={{ fontSize: "11px", margin: "2px 0 0", opacity: 0.8 }}>Powered by Advanced AI | 24/7 Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "20px",
                padding: "5px",
                borderRadius: "50%",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={(e) => e.target.style.background = "none"}
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "8px"
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: "18px",
                  background: msg.sender === "user" ? "linear-gradient(135deg, #667eea, #764ba2)" : "white",
                  color: msg.sender === "user" ? "white" : "#333",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  wordWrap: "break-word"
                }}>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                    {msg.text.split('\n').map((line, i) => (
                      <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ))}
                  </div>
                  
                  {/* Display products if available */}
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>📦 Recommended Products:</p>
                      {msg.products.map((product, i) => (
                        <div 
                          key={i}
                          onClick={() => handleProductClick(product)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px",
                            marginBottom: "6px",
                            background: "#f5f5f5",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#e8e8e8"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
                        >
                          <img 
                            src={product.image || "https://picsum.photos/50/50"} 
                            alt={product.name}
                            style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }}
                            onError={(e) => e.target.src = "https://picsum.photos/50/50"}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold", fontSize: "13px" }}>{product.name}</div>
                            <div style={{ fontSize: "12px", color: "#4CAF50" }}>${product.price}</div>
                            {product.sale && <div style={{ fontSize: "10px", color: "#ff416c" }}>🔥 SALE -20%</div>}
                          </div>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={(e) => handleAddToCart(product, e)}
                              style={{
                                padding: "6px",
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                              title="Add to Cart"
                            >
                              <FaShoppingCart size={12} />
                            </button>
                            <button
                              onClick={(e) => handleAddToFavorites(product, e)}
                              style={{
                                padding: "6px",
                                background: "#ff416c",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                              title="Add to Favorites"
                            >
                              <FaHeart size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ fontSize: "10px", color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : "#999", marginTop: "6px" }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "8px" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "18px",
                  background: "white",
                  color: "#666",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <FaSpinner className="spinner" size={14} />
                  <span>SmartAI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: "10px 15px",
            background: "white",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {[
              { icon: <FaTags size={12} />, text: "Find deals", query: "Show me products on sale" },
              { icon: <FaTruck size={12} />, text: "Shipping", query: "Shipping time?" },
              { icon: <FaCreditCard size={12} />, text: "Payment", query: "Payment methods?" },
              { icon: <FaUndo size={12} />, text: "Returns", query: "Return policy?" },
              { icon: <FaStar size={12} />, text: "Recommend", query: "Recommend best products" }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputMessage(action.query);
                  setTimeout(() => sendMessage(), 100);
                }}
                style={{
                  padding: "6px 12px",
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#e0e0e0"}
                onMouseLeave={(e) => e.target.style.background = "#f0f0f0"}
              >
                {action.icon} {action.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{
            padding: "15px",
            borderTop: "1px solid #eee",
            background: "white",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end"
          }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about products, orders, shipping, returns..."
              rows="2"
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "20px",
                resize: "none",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                background: inputMessage.trim() ? "linear-gradient(135deg, #667eea, #764ba2)" : "#ccc",
                border: "none",
                color: "white",
                cursor: inputMessage.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <FaPaperPlane size={18} />
            </button>
          </div>
          
          {/* Footer */}
          <div style={{
            padding: "8px",
            textAlign: "center",
            fontSize: "10px",
            color: "#999",
            borderTop: "1px solid #eee",
            background: "white"
          }}>
            🤖 SmartAI Assistant | Can answer ANY question | 24/7 Support
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AIUniversalAssistant;