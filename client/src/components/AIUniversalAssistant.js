// ============================================================
// SMARTIFY LB - AI UNIVERSAL ASSISTANT (OpenAI + Local Fallback)
// ============================================================
// This is the floating chatbot widget that appears on every page
// It first tries the OpenAI API on your backend for intelligent responses
// If OpenAI is unavailable, it falls back to local rule-based responses
// Features: product search, order tracking, favorites, shipping, returns
// Works with or without user authentication
// ============================================================

// ============================================================
// IMPORT REACT AND REQUIRED HOOKS
// ============================================================
// useState - manages component state (messages, input, loading)
// useEffect - runs code when component mounts or dependencies change
// useRef - creates a reference to scroll to bottom of messages
// ============================================================
import React, { useState, useEffect, useRef } from "react";

// ============================================================
// IMPORT ICONS FROM REACT ICONS LIBRARY
// ============================================================
// FaRobot - chatbot icon for the floating button
// FaTimes - close button for the chat window
// FaPaperPlane - send message button
// FaSpinner - loading animation while AI thinks
// FaShoppingCart, FaHeart - add to cart/favorites buttons on products
// FaStar, FaTags, FaTruck, FaCreditCard, FaUndo - quick action buttons
// ============================================================
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaShoppingCart, FaHeart, FaStar, FaTags, FaTruck, FaCreditCard, FaUndo } from "react-icons/fa";

// ============================================================
// IMPORT AUTH CONTEXT
// ============================================================
// useAuth hook gives access to:
//   - token: JWT for authenticated API requests
//   - user: logged-in user data (name, email, etc.)
//   - isAuthenticated: boolean, true if user is logged in
// ============================================================
import { useAuth } from "../context/AuthContext";

// ============================================================
// MAIN COMPONENT: AIUniversalAssistant
// ============================================================
// Props received from parent:
//   - addToCart: function to add product to shopping cart
//   - addToFavorites: function to add product to favorites
// These allow the chatbot to interact with the shopping cart
// ============================================================
const AIUniversalAssistant = ({ addToCart, addToFavorites }) => {
  
  // ============================================================
  // STATE: Chat Window Open/Closed
  // ============================================================
  // false = showing just the floating button
  // true = showing the full chat window
  // ============================================================
  const [isOpen, setIsOpen] = useState(false);
  
  // ============================================================
  // STATE: Messages Array
  // ============================================================
  // Stores all messages in the conversation
  // Each message has:
  //   - text: the message content (supports markdown)
  //   - sender: "user" or "bot"
  //   - products: optional array of product recommendations
  //   - timestamp: when the message was sent
  // Initial message is the welcome/intro from the bot
  // ============================================================
  const [messages, setMessages] = useState([
    { 
      text: "👋 **Hello! I'm SmartAI - Your Universal Shopping Assistant!**\n\nI can help you with:\n• 🔍 **Find products** - \"Find laptop under $500\"\n• 📦 **Order tracking** - \"Where's my order?\"\n• 💰 **Pricing & Sales** - \"Any discounts?\"\n• 📝 **Product advice** - \"Best phone for gaming?\"\n• 🚚 **Shipping info** - \"Delivery time?\"\n• 🔄 **Returns policy** - \"How to return?\"\n• ❤️ **Favorites** - \"Show my favorites\"\n\n💡 **Try asking anything!**", 
      sender: "bot",        // This is from the AI assistant
      timestamp: new Date() // Current time
    }
  ]);
  
  // ============================================================
  // STATE: Input Message
  // ============================================================
  // The text the user is currently typing in the input field
  // Updates on every keystroke
  // ============================================================
  const [inputMessage, setInputMessage] = useState("");
  
  // ============================================================
  // STATE: Bot Typing Indicator
  // ============================================================
  // true = showing "SmartAI is thinking..." animation
  // false = not showing typing indicator
  // Set to true when waiting for API response
  // ============================================================
  const [isTyping, setIsTyping] = useState(false);
  
  // ============================================================
  // STATE: Product Recommendations
  // ============================================================
  // Stores products found by the search engine
  // Displayed as clickable cards in the chat
  // ============================================================
  const [recommendations, setRecommendations] = useState([]);
  
  // ============================================================
  // STATE: User Orders (for order tracking feature)
  // ============================================================
  // Fetched from API when user is logged in
  // Used to answer "Where's my order?" type questions
  // ============================================================
  const [userOrders, setUserOrders] = useState([]);
  
  // ============================================================
  // STATE: User Favorites (for favorites feature)
  // ============================================================
  // Fetched from API when user is logged in
  // Used to answer "Show my favorites" type questions
  // ============================================================
  const [userFavorites, setUserFavorites] = useState([]);
  
  // ============================================================
  // REF: Scroll to Bottom of Messages
  // ============================================================
  // Creates a reference to an invisible div at the end of messages
  // When new messages arrive, we scroll to this div
  // This keeps the chat auto-scrolled to the latest message
  // ============================================================
  const messagesEndRef = useRef(null);
  
  // ============================================================
  // AUTH CONTEXT: Get user data
  // ============================================================
  // Destructures token, user, and isAuthenticated from auth context
  // Used for personalized responses and API calls
  // ============================================================
  const { token, user, isAuthenticated } = useAuth();

  // ============================================================
  // LIFECYCLE: useEffect Hook
  // ============================================================
  // Runs when component mounts or dependencies change
  // Dependencies: [messages, isAuthenticated, token]
  // 
  // Actions:
  // 1. Scrolls to bottom when new messages arrive
  // 2. Fetches user orders if authenticated
  // 3. Fetches user favorites if authenticated
  // ============================================================
  useEffect(() => {
    scrollToBottom();  // Auto-scroll to latest message
    
    // Only fetch user data if logged in with a valid token
    if (isAuthenticated && token) {
      fetchUserOrders();     // Get order history for tracking
      fetchUserFavorites();  // Get favorites for quick access
    }
  }, [messages, isAuthenticated, token]);  // Re-run when these change

  // ============================================================
  // HELPER: Scroll Chat to Bottom
  // ============================================================
  // Uses the messagesEndRef to scroll the chat container
  // smooth behavior = animated scroll instead of instant jump
  // Optional chaining (?.) prevents error if ref is null
  // ============================================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ============================================================
  // API CALL: Fetch User Orders
  // ============================================================
  // GET request to /api/orders with JWT token for authentication
  // Stores the result in userOrders state
  // Used for order tracking feature in chat
  // ============================================================
  const fetchUserOrders = async () => {
    try {
      // Make authenticated request to backend
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` }  // JWT in header
      });
      
      // Only process if request was successful
      if (response.ok) {
        const data = await response.json();  // Parse JSON response
        setUserOrders(data);                 // Store orders in state
      }
    } catch (error) {
      // Log error but don't crash - orders feature just won't work
      console.error("Error fetching orders:", error);
    }
  };

  // ============================================================
  // API CALL: Fetch User Favorites
  // ============================================================
  // GET request to /api/favorites with JWT token
  // Stores the result in userFavorites state
  // Used for favorites feature in chat
  // ============================================================
  const fetchUserFavorites = async () => {
    try {
      // Make authenticated request to backend
      const response = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` }  // JWT in header
      });
      
      // Only process if request was successful
      if (response.ok) {
        const data = await response.json();  // Parse JSON response
        setUserFavorites(data);              // Store favorites in state
      }
    } catch (error) {
      // Log error but don't crash - favorites feature just won't work
      console.error("Error fetching favorites:", error);
    }
  };

  // ============================================================
  // PRODUCT SEARCH ENGINE
  // ============================================================
  // This is the core search function that powers product recommendations
  // It fetches ALL products and filters them client-side
  // Supports filtering by: price, category, sale status, search term
  // Returns top 6 scored results
  // ============================================================
  const searchProducts = async (criteria) => {
    try {
      // ============================================================
      // FETCH ALL PRODUCTS FROM API
      // ============================================================
      // Gets the complete product catalog
      // No authentication required for browsing products
      // ============================================================
      const response = await fetch("http://localhost:5000/api/products");
      const products = await response.json();
      
      // ============================================================
      // FILTER: Only show in-stock products
      // ============================================================
      // Products with quantity > 0 are available
      // Out-of-stock items are hidden from recommendations
      // ============================================================
      let filtered = products.filter(p => p.quantity > 0);
      
      // ============================================================
      // FILTER: Price Range
      // ============================================================
      // If minPrice specified, only show products at or above that price
      // If maxPrice specified, only show products at or below that price
      // Both can be used together for a price range
      // ============================================================
      if (criteria.minPrice) filtered = filtered.filter(p => p.price >= criteria.minPrice);
      if (criteria.maxPrice) filtered = filtered.filter(p => p.price <= criteria.maxPrice);
      
      // ============================================================
      // FILTER: Category
      // ============================================================
      // Maps category names to search keywords
      // For example, "laptop" matches products with "laptop", "computer", "notebook", etc.
      // This makes category search smarter than just name matching
      // ============================================================
      if (criteria.category) {
        // Define keywords for each category
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
        
        // Get keywords for the selected category, or use the category name itself
        const keywords = categoryKeywords[criteria.category] || [criteria.category];
        
        // Keep products that match at least one keyword
        filtered = filtered.filter(p => 
          keywords.some(k => p.name.toLowerCase().includes(k))
        );
      }
      
      // ============================================================
      // FILTER: Sale Items Only
      // ============================================================
      // If user asks for "deals" or "sale items"
      // Only shows products with sale flag = 1 or true
      // ============================================================
      if (criteria.saleOnly) {
        filtered = filtered.filter(p => p.sale === 1 || p.sale === true);
      }
      
      // ============================================================
      // FILTER: Search Term
      // ============================================================
      // If a search term is provided, match against product name
      // Case-insensitive matching
      // ============================================================
      if (criteria.searchTerm) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(criteria.searchTerm.toLowerCase())
        );
      }
      
      // ============================================================
      // SCORING: Rank Products by Relevance
      // ============================================================
      // Each product gets a score based on:
      //   - Within budget: +30 points
      //   - On sale: +20 points
      //   - High stock (20+ units): +10 points
      // Higher score = better recommendation
      // ============================================================
      const scored = filtered.map(p => {
        let score = 0;
        
        // Bonus for matching the user's budget
        if (criteria.budget && p.price <= criteria.budget) score += 30;
        
        // Bonus for sale items (good deals)
        if (p.sale) score += 20;
        
        // Bonus for well-stocked items (reliable availability)
        if (p.quantity > 20) score += 10;
        
        return { ...p, score };  // Add score to product object
      });
      
      // ============================================================
      // SORT & LIMIT: Return Top 6 Results
      // ============================================================
      // Sort by score (highest first)
      // Only return the top 6 to avoid overwhelming the user
      // ============================================================
      scored.sort((a, b) => b.score - a.score);  // Descending order
      return scored.slice(0, 6);                  // Top 6 only
      
    } catch (error) {
      // Log error and return empty array
      // Chat will show "no products found" message
      console.error("Error searching products:", error);
      return [];
    }
  };

  // ============================================================
  // ORDER TRACKING HELPER
  // ============================================================
  // Looks up an order by its order number (e.g., "ORD-12345")
  // Returns a user-friendly status message with emoji
  // Maps database status to human-readable descriptions
  // ============================================================
  const getOrderStatus = (orderNumber) => {
    // Find the order in the user's orders array
    const order = userOrders.find(o => o.order_number === orderNumber);
    
    if (order) {
      // ============================================================
      // STATUS MAPPING
      // ============================================================
      // Converts database status codes to friendly messages
      // Each status has a relevant emoji and description
      // ============================================================
      const statusMap = {
        pending: "⏳ Processing - We're preparing your order",
        processing: "📦 Packing - Your order is being packed",
        shipped: "🚚 Shipped - On its way to you!",
        delivered: "✅ Delivered - Enjoy your purchase!",
        cancelled: "❌ Cancelled - Order was cancelled"
      };
      
      // Return the mapped status or the raw status as fallback
      return statusMap[order.order_status] || `Status: ${order.order_status}`;
    }
    
    // Order not found in user's orders
    return null;
  };

  // ============================================================
  // AI RESPONSE ENGINE (OpenAI API + Local Fallback)
  // ============================================================
  // This is the brain of the chatbot
  // It decides how to respond to user messages
  // Strategy: Try OpenAI first, fall back to local rules
  // ============================================================
  const analyzeAndRespond = async (message) => {
    
    // ============================================================
    // ATTEMPT 1: CALL grocai API ON BACKEND
    // ============================================================
    // Sends the conversation to your backend's /api/ai/chat endpoint
    // Backend uses Groq AI (free Llama 3.3 70B model)
    // Includes last 10 messages for conversation context
    // ============================================================
    try {
      // ============================================================
      // PREPARE CONVERSATION HISTORY
      // ============================================================
      // Takes the last 10 messages from the chat
      // Converts them to the format the AI expects:
      //   - role: "user" or "assistant"
      //   - content: the message text
      // This gives the AI context about what was discussed
      // ============================================================
      const history = messages.slice(-10).map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",  // Map sender to API role
        content: msg.text                                      // The message content
      }));

      // ============================================================
      // MAKE API REQUEST TO BACKEND
      // ============================================================
      // POST request to /api/ai/chat endpoint
      // Includes message, history, and customer ID for personalization
      // ============================================================
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,           // The user's current message
          history: history,           // Previous conversation context
          customerId: user?.id || null // User ID for personalization (if logged in)
        })
      });

      // ============================================================
      // PROCESS SUCCESSFUL AI RESPONSE
      // ============================================================
      // If the API call succeeded, use the AI-generated response
      // This is the preferred path - intelligent, contextual responses
      // ============================================================
      if (response.ok) {
        const data = await response.json();  // Parse the AI response
        console.log("✅ OpenAI response received");
        
        // Return the AI's reply with no product cards
        // AI responses are text-only (product cards are local fallback feature)
        return { text: data.reply, products: [] };
      }
    } catch (error) {
      // ============================================================
      // AI API FAILED - WILL USE LOCAL FALLBACK
      // ============================================================
      // Common reasons for failure:
      //   - Backend server is down
      //   - Groq API key not configured
      //   - Network error
      //   - Rate limit exceeded
      // Chatbot continues working with rule-based responses
      // ============================================================
      console.log("⚠️ OpenAI unavailable, using local fallback:", error.message);
    }

    // ============================================================
    // ATTEMPT 2: LOCAL RULE-BASED FALLBACK
    // ============================================================
    // This runs when AI API is unavailable
    // Uses keyword matching and pattern recognition
    // More limited but always works offline
    // ============================================================
    
    // Convert message to lowercase for case-insensitive matching
    const msg = message.toLowerCase();
    
    // ============================================================
    // PATTERN: ORDER TRACKING
    // ============================================================
    // Checks if user is asking about an order
    // Looks for order number pattern: "ORD-" followed by numbers
    // Also checks for keywords: "order", "status", "where"
    // ============================================================
    const orderMatch = msg.match(/(?:order|#|ORD-)?\s*([A-Z0-9\-]{10,})/i);
    if (orderMatch && (msg.includes('order') || msg.includes('status') || msg.includes('where'))) {
      const orderNumber = orderMatch[1];  // Extract the order number
      const status = getOrderStatus(orderNumber);  // Look up status
      
      if (status) {
        // Order found - show the status
        return { 
          text: `📦 **Order ${orderNumber}**: ${status}\n\nNeed more help? I can also help you track your order or answer questions about delivery!`, 
          products: [] 
        };
      } else if (userOrders.length > 0) {
        // Order not found but user has orders - show all their orders
        return { 
          text: `I couldn't find order ${orderNumber}. Here are your recent orders:\n\n${userOrders.map(o => `• **${o.order_number}** - ${o.order_status} - $${o.total_amount}`).join('\n')}\n\nWhich order would you like to track?`, 
          products: [] 
        };
      } else {
        // No orders found at all
        return { 
          text: `I couldn't find that order. If you've placed an order, please make sure you're logged in. Need help? Contact support@smartify.com`, 
          products: [] 
        };
      }
    }
    
    // ============================================================
    // PATTERN: FAVORITES
    // ============================================================
    // Detects when user asks about their favorites/wishlist
    // Keywords: "favorite", "saved", "my liked"
    // Shows products with ❤️ icon if user has favorites
    // ============================================================
    if (msg.includes('favorite') || msg.includes('saved') || (msg.includes('my') && msg.includes('liked'))) {
      if (userFavorites.length > 0) {
        // User has favorites - show them as product cards
        return { 
          text: `❤️ **Your Favorites (${userFavorites.length} items)**\n\nHere are the products you've saved. Click any to view details or add to cart!`, 
          products: userFavorites  // Include the actual favorite products
        };
      } else {
        // No favorites yet - encourage them to add some
        return { 
          text: `You don't have any favorites yet. Start adding products you love by clicking the ❤️ button on any product!`, 
          products: [] 
        };
      }
    }
    
    // ============================================================
    // PATTERN: ORDER HISTORY
    // ============================================================
    // User wants to see all their recent orders
    // Keywords: "my orders", "my order"
    // Shows order list with numbers, status, amounts, and dates
    // ============================================================
    if (msg.includes('my order') || (msg.includes('my') && msg.includes('orders'))) {
      if (userOrders.length > 0) {
        // Show all recent orders with details
        return { 
          text: `📋 **Your Recent Orders (${userOrders.length})**\n\n${userOrders.map(o => `• **${o.order_number}** - ${o.order_status} - $${o.total_amount} (${new Date(o.created_at).toLocaleDateString()})`).join('\n')}\n\nWant to track a specific order? Tell me the order number!`, 
          products: [] 
        };
      } else {
        // No orders yet - encourage shopping
        return { 
          text: `You haven't placed any orders yet. Ready to shop? I can help you find the perfect products! 🛍️`, 
          products: [] 
        };
      }
    }
    
    // ============================================================
    // PATTERN: SHIPPING INFORMATION
    // ============================================================
    // Keywords: "shipping", "delivery", "ship"
    // Returns standard shipping policy information
    // ============================================================
    if (msg.includes('shipping') || msg.includes('delivery') || msg.includes('ship')) {
      return { 
        text: `🚚 **Shipping Information**\n\n• **Express Delivery**: 2-3 working days - $3.00\n• **Free Shipping**: On orders over $500\n• **Tracking**: You'll receive a tracking number via email once shipped\n\nNeed to track an order? Give me your order number!`, 
        products: [] 
      };
    }
    
    // ============================================================
    // PATTERN: RETURNS POLICY
    // ============================================================
    // Keywords: "return", "refund", "exchange"
    // Returns standard return/refund policy information
    // ============================================================
    if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
      return { 
        text: `🔄 **Returns & Refunds**\n\n• **Return Window**: 14 days from delivery\n• **Condition**: Items must be unused and in original packaging\n• **Refund Time**: 5-7 business days after we receive the item\n• **How to Return**: Contact support@smartify.com with your order number\n\nNeed help with a specific order? I can help track it!`, 
        products: [] 
      };
    }
    
    // ============================================================
    // PATTERN: PAYMENT METHODS
    // ============================================================
    // Keywords: "payment", "pay", "cod", "cash"
    // Returns accepted payment methods
    // ============================================================
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('cod') || msg.includes('cash')) {
      return { 
        text: `💳 **Payment Methods**\n\nWe accept:\n• 💵 Cash on Delivery (COD)\n• 💳 Whish Pay\n• 📱 WPAY\n\nAll payments are secure and encrypted! 🔒`, 
        products: [] 
      };
    }
    
    // ============================================================
    // PATTERN: PRODUCT SEARCH
    // ============================================================
    // This is the most complex fallback pattern
    // Extracts search parameters from natural language:
    //   - Budget: "under $500", "below $1000", "max $300"
    //   - Category: "laptop", "phone", "watch", etc.
    //   - Sale only: "sale", "discount", "deal"
    //   - Feature: "gaming", "music", "work", "fitness"
    // Then calls searchProducts() with these parameters
    // ============================================================
    
    // Initialize search criteria
    let budget = null;      // Maximum price
    let category = null;    // Product category
    let saleOnly = false;   // Only show sale items
    let feature = null;     // Use case (gaming, music, etc.)
    
    // ============================================================
    // EXTRACT BUDGET FROM MESSAGE
    // ============================================================
    // Looks for patterns like:
    //   "under 500" → budget = 500
    //   "below $1000" → budget = 1000
    //   "less than 300" → budget = 300
    //   "budget 200" → budget = 200
    //   "max 150" → budget = 150
    // The (\d+) captures the number
    // ============================================================
    const budgetMatch = msg.match(/(?:under|below|less than|budget|max)\s*\$?(\d+)/);
    if (budgetMatch) budget = parseInt(budgetMatch[1]);  // Convert string to integer
    
    // ============================================================
    // DETECT PRODUCT CATEGORY
    // ============================================================
    // Checks if message contains any category keyword
    // Loops through predefined categories list
    // Sets the first matching category found
    // ============================================================
    const categories = ['laptop', 'phone', 'watch', 'headphone', 'speaker', 'tablet', 'charger', 'accessory'];
    for (const cat of categories) {
      if (msg.includes(cat)) { 
        category = cat;  // Found a matching category
        break;           // Stop after first match
      }
    }
    
    // ============================================================
    // DETECT SALE/DISCOUNT INTENT
    // ============================================================
    // Keywords: "sale", "discount", "deal"
    // When detected, only shows products on sale
    // ============================================================
    if (msg.includes('sale') || msg.includes('discount') || msg.includes('deal')) saleOnly = true;
    
    // ============================================================
    // DETECT USE CASE / FEATURE
    // ============================================================
    // Helps narrow down recommendations by use case
    // "gaming" → high-performance products
    // "music" → audio-focused products
    // "work" → productivity products
    // "fitness" → sport/health products
    // ============================================================
    if (msg.includes('gaming')) feature = 'gaming';
    if (msg.includes('music')) feature = 'music';
    if (msg.includes('work')) feature = 'work';
    if (msg.includes('fitness')) feature = 'fitness';
    
    // ============================================================
    // EXECUTE PRODUCT SEARCH
    // ============================================================
    // Only search if user specified some criteria
    // Otherwise skip to avoid showing irrelevant results
    // ============================================================
    let products = [];
    if (budget || category || saleOnly || feature) {
      products = await searchProducts({ 
        budget,           // Maximum price
        category,         // Product category
        saleOnly,         // Sale items only flag
        maxPrice: budget, // Upper price limit
        minPrice: msg.includes('over') || msg.includes('above') ? budget : null,  // Lower price limit
        searchTerm: msg   // The original message as search term
      });
    }
    
    // ============================================================
    // BUILD RESPONSE WITH PRODUCT RECOMMENDATIONS
    // ============================================================
    // If products were found, create a contextual response
    // Different messages based on the search type
    // ============================================================
    if (products.length > 0) {
      let responseText = "";
      
      // Budget-based search response
      if (budget) responseText = `🎯 **Found ${products.length} great ${category || 'product'} option${products.length !== 1 ? 's' : ''} under $${budget}!**\n\n`;
      
      // Sale items response
      else if (saleOnly) responseText = `🔥 **Hot Deals! Here are ${products.length} items on sale:**\n\n`;
      
      // Category search response
      else if (category) responseText = `📱 **Here are the best ${category}${feature ? ` for ${feature}` : ''}s we recommend:**\n\n`;
      
      // Generic response
      else responseText = `✨ **Here are some products you might like:**\n\n`;
      
      // Add feature-specific tips
      if (feature === 'gaming') responseText += `🎮 **For gaming**, look for high-performance products with fast processors and great graphics!\n\n`;
      if (feature === 'music') responseText += `🎵 **For music**, focus on audio quality and comfort. Check these out:\n\n`;
      if (feature === 'work') responseText += `💼 **Perfect for work** - these products offer great productivity features:\n\n`;
      
      // Return response with product cards
      return { text: responseText, products };
    }
    
    // ============================================================
    // PATTERN: GREETINGS
    // ============================================================
    // Responds to "hello", "hi", "hey"
    // Personalizes with user's name if logged in
    // ============================================================
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      const name = user?.first_name ? user.first_name : 'there';  // Use name if available
      return { 
        text: `👋 **Hello ${name}!** Welcome to Smartify AI Assistant!\n\nI can help you with:\n• 🔍 Finding products\n• 📦 Tracking orders\n• 💰 Checking prices\n• 🚚 Shipping info\n• 🔄 Returns\n\nWhat would you like to know today?`, 
        products: [] 
      };
    }
    
    // ============================================================
    // PATTERN: PRICE INQUIRY (without specific budget)
    // ============================================================
    // User asks about prices but didn't specify a budget
    // Gives examples of how to ask for price information
    // ============================================================
    if (msg.includes('price') && !budget) {
      return { 
        text: `💰 **Need price information?**\n\nTry asking:\n• "Find laptop under $500"\n• "What's the price of iPhone?"\n• "Show me products on sale"\n\nOr tell me what you're looking for and your budget!`, 
        products: [] 
      };
    }
    
    // ============================================================
    // FALLBACK: DEFAULT HELP MESSAGE
    // ============================================================
    // When no patterns match, show the full help menu
    // Lists all available commands and features
    // This is the catch-all response
    // ============================================================
    return { 
      text: `🤖 **I'm here to help!**\n\nHere's what I can do:\n\n🔍 **Find Products**\n• "Find laptop under $500"\n• "Best gaming phone"\n• "Headphones on sale"\n\n📦 **Order Help**\n• "Track my order"\n• "Where's order ORD-12345?"\n• "My recent orders"\n\n❤️ **Favorites**\n• "Show my favorites"\n• "What I liked"\n\n📋 **General Info**\n• "Shipping time?"\n• "Return policy"\n• "Payment methods"\n\nWhat would you like to know?`, 
      products: [] 
    };
  };

  // ============================================================
  // MESSAGE HANDLER: Send User Message
  // ============================================================
  // This function runs when the user clicks send or presses Enter
  // It:
  // 1. Adds the user's message to the chat
  // 2. Clears the input field
  // 3. Shows typing indicator
  // 4. Gets AI response
  // 5. Adds AI response to chat
  // 6. Hides typing indicator
  // ============================================================
  const sendMessage = async () => {
    // ============================================================
    // VALIDATE: Don't send empty messages
    // ============================================================
    // trim() removes whitespace from both ends
    // If nothing left after trimming, ignore the send
    // ============================================================
    if (!inputMessage.trim()) return;

    // ============================================================
    // STEP 1: ADD USER MESSAGE TO CHAT
    // ============================================================
    // Save the message before clearing the input
    // This prevents losing the message if something goes wrong
    // ============================================================
    const userMessage = inputMessage;  // Capture current input value
    
    // Add user message to messages array
    // Using spread operator (...prev) to create new array with old messages
    // This is important for React to detect the state change
    setMessages(prev => [...prev, { 
      text: userMessage,           // The message content
      sender: "user",              // Mark as user message (right-aligned)
      timestamp: new Date()        // Current time for display
    }]);
    
    // ============================================================
    // STEP 2: CLEAR INPUT FIELD
    // ============================================================
    // Reset the input to empty string
    // User can start typing their next message immediately
    // ============================================================
    setInputMessage("");
    
    // ============================================================
    // STEP 3: SHOW TYPING INDICATOR
    // ============================================================
    // Shows "SmartAI is thinking..." animation
    // Gives user feedback that their message is being processed
    // ============================================================
    setIsTyping(true);

    try {
      // ============================================================
      // STEP 4: GET AI RESPONSE
      // ============================================================
      // Calls the analyzeAndRespond function
      // This tries OpenAI first, falls back to local rules
      // Returns { text, products } object
      // ============================================================
      const response = await analyzeAndRespond(userMessage);
      
      // ============================================================
      // STEP 5: ADD BOT RESPONSE TO CHAT
      // ============================================================
      // Adds the AI's reply to the messages array
      // Includes any product recommendations for display
      // ============================================================
      setMessages(prev => [...prev, { 
        text: response.text,           // The bot's reply text
        sender: "bot",                 // Mark as bot message (left-aligned)
        products: response.products,   // Product cards to display (if any)
        timestamp: new Date()          // Current time
      }]);
      
      // ============================================================
      // UPDATE RECOMMENDATIONS STATE
      // ============================================================
      // If the response includes products, update recommendations
      // This is used by other parts of the UI (not just the chat)
      // ============================================================
      if (response.products && response.products.length > 0) {
        setRecommendations(response.products);
      }
    } catch (error) {
      // ============================================================
      // ERROR HANDLING: Show friendly error message
      // ============================================================
      // If the entire response system fails, show a fallback error
      // Includes support email for further help
      // ============================================================
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        text: "😅 I'm having trouble right now. Please try again or contact our support team at support@smartify.com", 
        sender: "bot", 
        timestamp: new Date() 
      }]);
    } finally {
      // ============================================================
      // STEP 6: HIDE TYPING INDICATOR
      // ============================================================
      // Runs whether the response succeeded or failed
      // Removes the "thinking" animation
      // ============================================================
      setIsTyping(false);
    }
  };

  // ============================================================
  // KEYBOARD HANDLER: Enter to Send, Shift+Enter for New Line
  // ============================================================
  // This allows multi-line messages
  // Enter alone = send message
  // Shift + Enter = new line in the input
  // ============================================================
  const handleKeyPress = (e) => {
    // Check if Enter was pressed WITHOUT Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();  // Prevent default newline behavior
      sendMessage();        // Send the message instead
    }
  };

  // ============================================================
  // PRODUCT INTERACTION: Navigate to Product Page
  // ============================================================
  // When user clicks a product card, redirect to product detail page
  // Uses window.location.href for navigation
  // ============================================================
  const handleProductClick = (product) => {
    window.location.href = `/products/${product.id}`;  // Go to product page
  };

  // ============================================================
  // PRODUCT INTERACTION: Add to Cart
  // ============================================================
  // Adds product to cart and shows confirmation message
  // e.stopPropagation() prevents triggering the parent click (navigation)
  // ============================================================
  const handleAddToCart = (product, e) => {
    e.stopPropagation();  // Don't navigate when clicking cart button
    
    // Call the addToCart function passed from parent component
    if (addToCart) addToCart(product);
    
    // Add confirmation message to chat
    setMessages(prev => [...prev, { 
      text: `✅ **Added ${product.name} to your cart!**\n\nWould you like to checkout or continue shopping?`, 
      sender: "bot", 
      timestamp: new Date() 
    }]);
  };

  // ============================================================
  // PRODUCT INTERACTION: Add to Favorites
  // ============================================================
  // Adds product to favorites and shows confirmation message
  // e.stopPropagation() prevents triggering the parent click (navigation)
  // ============================================================
  const handleAddToFavorites = (product, e) => {
    e.stopPropagation();  // Don't navigate when clicking favorite button
    
    // Call the addToFavorites function passed from parent component
    if (addToFavorites) addToFavorites(product);
    
    // Add confirmation message to chat
    setMessages(prev => [...prev, { 
      text: `❤️ **Added ${product.name} to your favorites!**\n\nYou can view it anytime in your Favorites page.`, 
      sender: "bot", 
      timestamp: new Date() 
    }]);
  };

  // ============================================================
  // HELPER: Format Time Display
  // ============================================================
  // Converts a Date object to a readable time string
  // Shows hours and minutes in 12-hour format
  // Example: "2:30 PM", "11:45 AM"
  // ============================================================
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit',   // 2-digit hour (01-12)
      minute: '2-digit'  // 2-digit minute (00-59)
    });
  };

  // ============================================================
  // RENDER: THE CHAT INTERFACE
  // ============================================================
  // Returns the complete chat widget
  // Two parts: Floating button + Chat window
  // ============================================================
  return (
    <>
      {/* ============================================================ */}
      {/* FLOATING CHAT BUTTON */}
      {/* ============================================================ */}
      {/* The purple circle button that floats in the bottom-right corner */}
      {/* Only visible when the chat window is CLOSED */}
      {/* Has a pulsing animation to attract attention */}
      {/* ============================================================ */}
      <button
        onClick={() => setIsOpen(true)}  // Open chat on click
        style={{
          position: "fixed",           // Stays in place when scrolling
          bottom: "30px",              // 30px from bottom of screen
          right: "30px",               // 30px from right of screen
          width: "70px",               // Circular button size
          height: "70px",
          borderRadius: "50%",         // Makes it a circle
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",  // Purple gradient
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",  // Purple glow shadow
          zIndex: 1000,                // Above most other elements
          display: isOpen ? "none" : "flex",  // Hide when chat is open
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",      // Smooth hover animation
          animation: "pulse 2s infinite"  // Attention-grabbing pulse
        }}
        // Hover effect: grow slightly
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {/* Robot icon inside the button */}
        <FaRobot size={32} />
        
        {/* "AI" badge in top-right corner of the button */}
        <div style={{
          position: "absolute",
          top: "-5px",
          right: "-5px",
          width: "22px",
          height: "22px",
          background: "#ff416c",       // Red-pink badge
          borderRadius: "50%",         // Circular badge
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold"
        }}>AI</div>
      </button>

      {/* ============================================================ */}
      {/* CHAT WINDOW */}
      {/* ============================================================ */}
      {/* The full chat interface that appears when button is clicked */}
      {/* Fixed position in bottom-right corner */}
      {/* 480px wide × 700px tall */}
      {/* Slides up with animation when opened */}
      {/* ============================================================ */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "480px",              // Fixed width
          height: "700px",             // Fixed height
          background: "white",
          borderRadius: "20px",        // Rounded corners
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",  // Strong shadow for depth
          display: "flex",
          flexDirection: "column",     // Stack children vertically
          zIndex: 1001,                // Above the floating button
          overflow: "hidden",          // Clip rounded corners
          animation: "slideUp 0.3s ease"  // Entrance animation
        }}>
          
          {/* ============================================================ */}
          {/* HEADER BAR */}
          {/* ============================================================ */}
          {/* Purple gradient header with bot info and close button */}
          {/* ============================================================ */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            {/* Left side: Bot avatar + name + subtitle */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Bot avatar circle */}
              <div style={{ 
                background: "rgba(255,255,255,0.2)",  // Semi-transparent white
                borderRadius: "50%", 
                padding: "8px" 
              }}>
                <FaRobot size={24} />
              </div>
              {/* Name and subtitle */}
              <div>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>SmartAI Assistant</span>
                <p style={{ fontSize: "11px", margin: "2px 0 0", opacity: 0.8 }}>
                  Powered by OpenAI | 24/7 Support
                </p>
              </div>
            </div>
            
            {/* Close button (X icon) */}
            <button 
              onClick={() => setIsOpen(false)}  // Close the chat
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
              // Hover effect: semi-transparent white background
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <FaTimes />
            </button>
          </div>

          {/* ============================================================ */}
          {/* MESSAGES AREA */}
          {/* ============================================================ */}
          {/* Scrollable area containing all chat messages */}
          {/* Light gray background for contrast */}
          {/* Messages are displayed in chronological order */}
          {/* ============================================================ */}
          <div style={{
            flex: 1,                    // Takes remaining space
            overflowY: "auto",         // Scrollable when messages overflow
            padding: "20px",
            background: "#f8f9fa",     // Light gray background
            display: "flex",
            flexDirection: "column",
            gap: "12px"                // Space between messages
          }}>
            {/* ============================================================ */}
            {/* MAP THROUGH MESSAGES */}
            {/* ============================================================ */}
            {/* Renders each message as a bubble */}
            {/* User messages: right-aligned, purple */}
            {/* Bot messages: left-aligned, white */}
            {/* ============================================================ */}
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",  // Right or left
                marginBottom: "8px"
              }}>
                {/* Message bubble */}
                <div style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: "18px",
                  // User = purple gradient, Bot = white
                  background: msg.sender === "user" 
                    ? "linear-gradient(135deg, #667eea, #764ba2)" 
                    : "white",
                  color: msg.sender === "user" ? "white" : "#333",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  wordWrap: "break-word"  // Long text wraps properly
                }}>
                  {/* ============================================================ */}
                  {/* MESSAGE TEXT (with markdown bold support) */}
                  {/* ============================================================ */}
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                    {/* Split by newlines and render each line */}
                    {msg.text.split('\n').map((line, i) => (
                      <div 
                        key={i} 
                        // Convert **bold** markdown to <strong> HTML tags
                        dangerouslySetInnerHTML={{ 
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }} 
                      />
                    ))}
                  </div>
                  
                  {/* ============================================================ */}
                  {/* PRODUCT RECOMMENDATION CARDS */}
                  {/* ============================================================ */}
                  {/* Only shown if the message has products attached */}
                  {/* Displays clickable product cards with image, name, price */}
                  {/* Includes Add to Cart and Add to Favorites buttons */}
                  {/* ============================================================ */}
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ 
                      marginTop: "15px", 
                      borderTop: "1px solid #eee",  // Separator line
                      paddingTop: "12px" 
                    }}>
                      <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                        📦 Recommended Products:
                      </p>
                      
                      {/* Map through each product */}
                      {msg.products.map((product, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleProductClick(product)}  // Navigate to product page
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px",
                            marginBottom: "6px",
                            background: "#f5f5f5",
                            borderRadius: "10px",
                            cursor: "pointer",  // Indicates it's clickable
                            transition: "all 0.2s"
                          }}
                          // Hover effect: darker background
                          onMouseEnter={(e) => e.currentTarget.style.background = "#e8e8e8"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
                        >
                          {/* Product image (with fallback placeholder) */}
                          <img 
                            src={product.image || "https://via.placeholder.com/50"} 
                            alt={product.name}
                            style={{ 
                              width: "50px", 
                              height: "50px", 
                              borderRadius: "8px", 
                              objectFit: "cover"  // Crop image to fit
                            }}
                            // If image fails to load, show placeholder
                            onError={(e) => e.target.src = "https://via.placeholder.com/50"} 
                          />
                          
                          {/* Product info: name + price + sale badge */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#4CAF50" }}>
                              ${product.price}
                            </div>
                            {product.sale && (
                              <div style={{ fontSize: "10px", color: "#ff416c" }}>
                                🔥 SALE
                              </div>
                            )}
                          </div>
                          
                          {/* Action buttons: Cart + Favorites */}
                          <div style={{ display: "flex", gap: "5px" }}>
                            {/* Add to Cart button (green) */}
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
                            
                            {/* Add to Favorites button (red) */}
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
                  
                  {/* Timestamp below each message */}
                  <div style={{
                    fontSize: "10px",
                    color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : "#999",
                    marginTop: "6px"
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* ============================================================ */}
            {/* TYPING INDICATOR */}
            {/* ============================================================ */}
            {/* Shows "SmartAI is thinking..." with spinning animation */}
            {/* Only visible when isTyping is true */}
            {/* ============================================================ */}
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
                  <FaSpinner className="spinner" size={14} />  {/* Spinning icon */}
                  <span>SmartAI is thinking...</span>
                </div>
              </div>
            )}
            
            {/* ============================================================ */}
            {/* SCROLL ANCHOR */}
            {/* ============================================================ */}
            {/* Invisible div at the bottom of messages */}
            {/* Used by scrollToBottom() to auto-scroll */}
            {/* ============================================================ */}
            <div ref={messagesEndRef} />
          </div>

          {/* ============================================================ */}
          {/* QUICK ACTION BUTTONS */}
          {/* ============================================================ */}
          {/* Horizontal row of preset question buttons */}
          {/* Allows users to quickly ask common questions */}
          {/* Each button fills the input and auto-sends */}
          {/* ============================================================ */}
          <div style={{
            padding: "10px 15px",
            background: "white",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"  // Buttons wrap to next line if needed
          }}>
            {/* Array of quick actions with icons and text */}
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
                  setInputMessage(action.query);  // Fill the input
                  setTimeout(() => sendMessage(), 100);  // Auto-send after brief delay
                }} 
                style={{
                  padding: "6px 12px",
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: "20px",  // Pill shape
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.2s"
                }}
                // Hover effect
                onMouseEnter={(e) => e.currentTarget.style.background = "#e0e0e0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f0f0f0"}
              >
                {action.icon} {action.text}
              </button>
            ))}
          </div>

          {/* ============================================================ */}
          {/* INPUT AREA */}
          {/* ============================================================ */}
          {/* Textarea + Send button at the bottom */}
          {/* Textarea supports multi-line input */}
          {/* Send button changes color when input has text */}
          {/* ============================================================ */}
          <div style={{
            padding: "15px",
            borderTop: "1px solid #eee",
            background: "white",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end"  // Align send button with bottom of textarea
          }}>
            {/* Message input textarea */}
            <textarea 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}  // Update on every keystroke
              onKeyPress={handleKeyPress}  // Enter to send, Shift+Enter for newline
              placeholder="Ask me anything about products, orders, shipping, returns..."
              rows="2"  // Default height of 2 rows
              style={{
                flex: 1,                    // Takes available space
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "20px",       // Rounded input
                resize: "none",             // Prevent manual resize
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",            // Remove default focus outline
                transition: "border 0.2s"
              }}
              // Focus effect: purple border
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            
            {/* Send button */}
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim()}  // Disabled when input is empty
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                // Purple when text entered, gray when empty
                background: inputMessage.trim() 
                  ? "linear-gradient(135deg, #667eea, #764ba2)" 
                  : "#ccc",
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
          
          {/* ============================================================ */}
          {/* FOOTER BAR */}
          {/* ============================================================ */}
          {/* Small text at the very bottom */}
          {/* Shows bot name and technology credits */}
          {/* ============================================================ */}
          <div style={{
            padding: "8px",
            textAlign: "center",
            fontSize: "10px",
            color: "#999",
            borderTop: "1px solid #eee",
            background: "white"
          }}>
            🤖 SmartAI Assistant | Powered by OpenAI | 24/7 Support
          </div>
        </div>
      )}
      
      {/* ============================================================ */}
      {/* CSS ANIMATIONS */}
      {/* ============================================================ */}
      {/* Inline styles for animations used in the component */}
      {/* slideUp: Chat window entrance animation */}
      {/* pulse: Floating button attention animation */}
      {/* spin: Typing indicator spinner */}
      {/* ============================================================ */}
      <style>{`
        /* Chat window slides up from below */
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        
        /* Floating button pulses to attract attention */
        @keyframes pulse { 
          0% { box-shadow: 0 0 0 0 rgba(102,126,234,0.7); } 
          70% { box-shadow: 0 0 0 10px rgba(102,126,234,0); } 
          100% { box-shadow: 0 0 0 0 rgba(102,126,234,0); } 
        }
        
        /* Spinner rotates continuously */
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </>
  );
};

// ============================================================
// EXPORT THE COMPONENT
// ============================================================
// Makes this component available for import in other files
// Used in App.js or layout components to add the chatbot
// ============================================================
export default AIUniversalAssistant;