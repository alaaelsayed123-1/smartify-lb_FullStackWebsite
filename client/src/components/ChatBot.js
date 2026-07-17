// ============================================================
// SMARTIFY LB - CHATBOT WITH groc AI + SMART FALLBACK
// ============================================================
// This component implements a floating chatbot widget with:
// - Groq AI integration for intelligent responses
// - Smart fallback system when API is busy/offline
// - Real-time API status monitoring
// - Conversation history management
// - Cached responses for better performance
// - Suggested questions for new users
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  FaRobot, FaTimes, FaPaperPlane, FaCommentDots, 
  FaSpinner, FaMagic, FaTrash 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ChatBot = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  // Controls chatbot window visibility
  const [isOpen, setIsOpen] = useState(false);
  
  // Stores all chat messages with metadata (sender, timestamp, source)
  const [messages, setMessages] = useState([
    { 
      text: "👋 Hello! I'm SmartAI, your AI shopping assistant powered by Groq AI. How can I help you today?",      
      sender: "bot", 
      timestamp: new Date(),
      source: 'system' // Messages can be from: system, user, bot, cache, fallback, error
    }
  ]);
  
  // Current user input text
  const [inputMessage, setInputMessage] = useState("");
  
  // Shows typing animation while waiting for AI response
  const [isTyping, setIsTyping] = useState(false);
  
  // Minimize/maximize toggle for chat window
  const [isMinimized, setIsMinimized] = useState(false);
  
  // API status: 'online' (normal), 'busy' (rate limited), 'offline' (no connection)
  const [apiStatus, setApiStatus] = useState('online');
  
  // ============================================================
  // REFS
  // ============================================================
  
  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef(null);
  
  // Ref for auto-focusing input field when chat opens
  const inputRef = useRef(null);
  
  // ============================================================
  // AUTH CONTEXT
  // ============================================================
  
  // Extract authentication data for personalized experience
  const { token, user } = useAuth();

  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Auto-scroll to bottom whenever new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input field when chat window opens for better UX
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Periodic API health check to monitor Groq AI availability
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai/status');
        if (response.ok) {
          const data = await response.json();
          // If approaching rate limit (14+ calls/min), mark as busy
          setApiStatus(data.callsThisMinute < 14 ? 'online' : 'busy');
        }
      } catch (error) {
        // API unreachable - switch to offline/fallback mode
        setApiStatus('offline');
      }
    };
    
    // Only poll API status when chat is open to save resources
    if (isOpen) {
      checkStatus();
      const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval); // Cleanup on unmount or close
    }
  }, [isOpen]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // Smooth scroll to the bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ============================================================
  // CORE FUNCTIONALITY - SEND MESSAGE
  // ============================================================
  
  const sendMessage = async () => {
    // Prevent sending empty messages
    if (!inputMessage.trim()) return;

    // Store user message before clearing input
    const userMessage = inputMessage;
    
    // Add user message to chat immediately for responsive UX
    setMessages(prev => [...prev, { 
      text: userMessage, 
      sender: "user", 
      timestamp: new Date() 
    }]);
    
    // Clear input field and show typing indicator
    setInputMessage("");
    setIsTyping(true);

    try {
      // Build conversation context from last 8 messages for AI understanding
      // Filter out system messages and limit to recent history for performance
      const history = messages
        .filter(m => m.sender !== 'system')
        .slice(-8) // Keep only last 8 messages for context window
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        }));

      // Send request to backend AI endpoint with context
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : '' // Include auth for personalized responses
        },
        body: JSON.stringify({ 
          message: userMessage,
          history: history, // Provide conversation context
          customerId: user?.id || null // Identify user for personalized experience
        })
      });

      // Parse AI response
      const data = await response.json();
      
      // Add visual indicators to show response source
      // ⚡ = cached response (instant), 🔄 = fallback response (basic mode)
      let sourceIndicator = '';
      if (data.source === 'cache') sourceIndicator = ' ⚡';
      if (data.source === 'fallback') sourceIndicator = ' 🔄';
      
      // Add bot response to chat
      setMessages(prev => [...prev, { 
        text: data.reply + sourceIndicator, 
        sender: "bot", 
        timestamp: new Date(),
        source: data.source // Track response origin for analytics
      }]);
      
    } catch (error) {
      // Handle connection errors gracefully
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        text: "😅 Sorry, I'm having trouble connecting. Please try again later or email support@smartify.com", 
        sender: "bot",
        timestamp: new Date(),
        source: 'error' // Mark as error response
      }]);
    } finally {
      // Always stop typing indicator, whether success or failure
      setIsTyping(false);
    }
  };

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle Enter key press (without Shift) to send message
  // Shift+Enter allows multiline input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline
      sendMessage();
    }
  };

  // Reset chat to initial state, clearing all conversation history
  const clearChat = () => {
    setMessages([
      { 
        text: "Chat cleared! How can I help you?", 
        sender: "bot", 
        timestamp: new Date(),
        source: 'system'
      }
    ]);
  };

  // Format timestamp for display in HH:MM format
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================================
  // SUGGESTED QUESTIONS
  // ============================================================
  
  // Quick action buttons for new users to start conversation
  const suggestedQuestions = [
    "What products do you have?",
    "Shipping information?",
    "Return policy?",
    "Payment methods?",
    "Track my order",
    "Best deals today?"
  ];

  // ============================================================
  // STYLING CONSTANTS
  // ============================================================
  
  // Status indicator color mapping for visual feedback
  const statusColors = {
    online: '#4CAF50',  // Green - API is responsive
    busy: '#FF9800',    // Orange - approaching rate limit
    offline: '#f44336'  // Red - no connection
  };

  // ============================================================
  // COMPONENT RENDER
  // ============================================================
  
  return (
    <>
      {/* ============================================================ */}
      {/* FLOATING CHAT BUTTON - Closed State */}
      {/* ============================================================ */}
      {/* Shows when chat is closed; features pulse animation and status dot */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 50,
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #667eea, #764ba2)", // Purple gradient
            borderRadius: "50%",
            border: "none",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)", // Glow effect
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.3s",
            animation: "pulse 2s infinite" // Attention-grabbing pulse
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"} // Hover effect
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <FaCommentDots size={28} />
          {/* Status indicator dot */}
          <div style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "16px",
            height: "16px",
            background: statusColors[apiStatus], // Dynamic color based on API status
            borderRadius: "50%",
            border: "2px solid white"
          }}></div>
        </button>
      )}

      {/* ============================================================ */}
      {/* CHAT WINDOW - Open State */}
      {/* ============================================================ */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 50,
          width: isMinimized ? "320px" : "420px",
          height: isMinimized ? "56px" : "600px",
          transition: "all 0.3s ease",
          animation: "slideInRight 0.3s ease-out" // Enter animation
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)", // Dark theme
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            overflow: "hidden",
            border: "1px solid rgba(102, 126, 234, 0.3)",
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}>
            
            {/* ============================================================ */}
            {/* CHAT HEADER */}
            {/* ============================================================ */}
            <div style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)", // Brand gradient
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              {/* Bot info section */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  <FaRobot style={{ color: "white", fontSize: "20px" }} />
                  {/* Live status indicator on bot avatar */}
                  <div style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "12px",
                    height: "12px",
                    background: statusColors[apiStatus],
                    borderRadius: "50%",
                    border: "2px solid white",
                    animation: "pulse 2s infinite" // Pulsing status dot
                  }}></div>
                </div>
                <div>
                  <h3 style={{ color: "white", fontWeight: "bold", margin: 0, fontSize: "16px" }}>
                    SmartAI Assistant
                  </h3>
                  {/* Dynamic status text */}
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", margin: "2px 0 0" }}>
                    {apiStatus === 'online' ? '🟢 Online - Groq  AI' : 
                     apiStatus === 'busy' ? '🟡 Busy - Fallback Mode' : 
                     '🔴 Offline - Basic Mode'}
                  </p>
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={clearChat} style={{
                  background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "16px"
                }} title="Clear chat">
                  <FaTrash />
                </button>
                <button onClick={() => setIsOpen(false)} style={{
                  background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px"
                }}>
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* MESSAGES AREA - Scrollable */}
            {/* ============================================================ */}
            {!isMinimized && (
              <>
                <div style={{
                  flex: 1,
                  overflowY: "auto", // Scrollable messages
                  padding: "16px",
                  background: "rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {/* Render all messages */}
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                        animation: "fadeInUp 0.3s ease-out" // Message appear animation
                      }}
                    >
                      {/* Bot avatar for bot messages */}
                      {msg.sender === "bot" && (
                        <div style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "8px"
                        }}>
                          <FaRobot style={{ color: "white", fontSize: "14px" }} />
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div style={{ maxWidth: "75%" }}>
                        <div style={{
                          padding: "12px 16px",
                          borderRadius: "16px",
                          background: msg.sender === "user" 
                            ? "linear-gradient(135deg, #667eea, #764ba2)" // User messages: purple gradient
                            : "rgba(255,255,255,0.1)", // Bot messages: semi-transparent
                          color: msg.sender === "user" ? "white" : "#e0e0e0",
                          border: msg.sender === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                          wordWrap: "break-word", // Handle long words/URLs
                          whiteSpace: "pre-wrap", // Preserve line breaks
                          fontSize: "14px",
                          lineHeight: "1.5"
                        }}>
                          {msg.text}
                        </div>
                        {/* Message metadata: timestamp and source */}
                        <p style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.4)",
                          marginTop: "4px",
                          textAlign: msg.sender === "user" ? "right" : "left"
                        }}>
                          {formatTime(msg.timestamp)}
                          {msg.source === 'cache' && ' • Cached'} // Indicate cached response
                          {msg.source === 'fallback' && ' • Basic mode'} // Indicate fallback mode
                        </p>
                      </div>
                      
                      {/* User avatar with first letter of name */}
                      {msg.sender === "user" && (
                        <div style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          background: "linear-gradient(135deg, #2196F3, #00BCD4)", // Blue gradient for user
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "8px"
                        }}>
                          <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>
                            {user?.first_name?.charAt(0) || "U"} // Show first initial, fallback to 'U'
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* ============================================================ */}
                  {/* TYPING INDICATOR - Shown while waiting for AI response */}
                  {/* ============================================================ */}
                  {isTyping && (
                    <div style={{ display: "flex", justifyContent: "flex-start", animation: "fadeIn 0.3s ease" }}>
                      {/* Bot avatar */}
                      <div style={{
                        width: "32px",
                        height: "32px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "8px"
                      }}>
                        <FaRobot style={{ color: "white", fontSize: "14px" }} />
                      </div>
                      {/* Animated dots for typing effect */}
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        gap: "4px",
                        alignItems: "center"
                      }}>
                        {/* Three bouncing dots with staggered delays */}
                        <div style={{
                          width: "8px",
                          height: "8px",
                          background: "#667eea",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite",
                          animationDelay: "0ms"
                        }}></div>
                        <div style={{
                          width: "8px",
                          height: "8px",
                          background: "#667eea",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite",
                          animationDelay: "0.2s"
                        }}></div>
                        <div style={{
                          width: "8px",
                          height: "8px",
                          background: "#667eea",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite",
                          animationDelay: "0.4s"
                        }}></div>
                      </div>
                    </div>
                  )}
                  {/* Invisible div for scroll anchoring */}
                  <div ref={messagesEndRef} />
                </div>

                {/* ============================================================ */}
                {/* SUGGESTED QUESTIONS - Quick action buttons */}
                {/* ============================================================ */}
                {/* Only show for first-time users (when messages length is 1) */}
                {messages.length <= 1 && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.3)",
                    borderTop: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <p style={{ 
                      fontSize: "12px", 
                      color: "rgba(255,255,255,0.5)", 
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <FaMagic style={{ color: "#667eea" }} /> Try asking:
                    </p>
                    {/* Render suggested question chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(question); // Pre-fill input
                            setTimeout(() => sendMessage(), 100); // Auto-send after short delay
                          }}
                          style={{
                            fontSize: "12px",
                            padding: "6px 12px",
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "20px",
                            color: "#ccc",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          // Hover effects for interactive feel
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(102, 126, 234, 0.3)";
                            e.currentTarget.style.borderColor = "#667eea";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* INPUT AREA - Message composition */}
                {/* ============================================================ */}
                <div style={{
                  padding: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)"
                }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    {/* Message input field */}
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress} // Send on Enter
                      placeholder="Ask me anything..."
                      rows="1" // Start with single row, auto-expands
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "20px",
                        color: "white",
                        fontSize: "14px",
                        resize: "none",
                        outline: "none",
                        minHeight: "40px",
                        maxHeight: "100px", // Limit expansion
                        fontFamily: "inherit"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#667eea"} // Highlight on focus
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                    />
                    {/* Send button */}
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()} // Disable when empty
                      style={{
                        width: "40px",
                        height: "40px",
                        minWidth: "40px",
                        background: inputMessage.trim() 
                          ? "linear-gradient(135deg, #667eea, #764ba2)" // Active: purple gradient
                          : "rgba(255,255,255,0.1)", // Disabled: faded
                        border: "none",
                        borderRadius: "50%",
                        color: "white",
                        cursor: inputMessage.trim() ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        opacity: inputMessage.trim() ? 1 : 0.5
                      }}
                    >
                      <FaPaperPlane style={{ fontSize: "14px" }} />
                    </button>
                  </div>
                  {/* Footer attribution */}
                  <p style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.3)",
                    textAlign: "center",
                    marginTop: "8px"
                  }}>
                    Powered by Google Groq AI • Smart Fallback System
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CSS ANIMATIONS */}
      {/* ============================================================ */}
      <style>{`
        /* Smooth entry animation for new messages */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Fade in animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Slide in from right for chat window */
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        /* Bouncing animation for typing indicator dots */
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        /* Pulsing glow for status indicators */
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `}</style>
    </>
  );
};

export default ChatBot;