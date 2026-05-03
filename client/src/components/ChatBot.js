import React, { useState, useEffect, useRef } from "react";
import { 
  FaRobot, FaTimes, FaPaperPlane, FaCommentDots, 
  FaSpinner, FaSmile, FaMicrophone, FaCrown, 
  FaMagic, FaGift, FaArrowCircleUp
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 Hello! I'm your AI assistant. How can I help you today?", sender: "bot", timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { token, user } = useAuth();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          customerId: user?.id || null
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { 
        text: data.reply, 
        sender: "bot", 
        timestamp: new Date() 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble right now. Please try again later.", 
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

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What products do you have?",
    "How to track my order?",
    "Shipping policy?",
    "Return policy?",
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-50 animate-fade-in-up"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:transform hover:scale-110">
            <FaCommentDots className="text-white text-2xl group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 animate-slide-in-right ${isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'}`}>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FaRobot className="text-white text-xl" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI Assistant</h3>
                    <p className="text-purple-200 text-xs">Online • Ready to help</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(!isMinimized);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {isMinimized ? <FaArrowCircleUp /> : <FaTimes />}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="h-[460px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {msg.sender === "bot" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-2 flex-shrink-0">
                          <FaRobot className="text-white text-sm" />
                        </div>
                      )}
                      <div className={`max-w-[70%] ${msg.sender === "user" ? "order-1" : ""}`}>
                        <div className={`px-4 py-2 rounded-2xl ${
                          msg.sender === "user" 
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                            : "bg-white/10 text-gray-200 border border-white/10"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                      {msg.sender === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center ml-2 flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {user?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-2">
                        <FaRobot className="text-white text-sm" />
                      </div>
                      <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions */}
                {messages.length === 1 && (
                  <div className="px-4 py-2 bg-gray-800/50 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <FaMagic className="text-purple-400" /> Suggested questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(question);
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="text-xs px-3 py-1 bg-white/10 hover:bg-purple-600/30 text-gray-300 rounded-full transition-all duration-300 hover:transform hover:scale-105"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-gray-800/50">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        rows="1"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none transition-all"
                        style={{ minHeight: '40px', maxHeight: '100px' }}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="text-white text-sm" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Powered by AI • Smartify Assistant
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </>
  );
};

export default ChatBot;