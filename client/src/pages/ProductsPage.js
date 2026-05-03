import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { FaSearch, FaTimes, FaRobot, FaMicrophone, FaStop, FaFilter, FaSort } from "react-icons/fa";

const ProductsPage = ({ addToCart, addToFavorites }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    fetchAllProducts();
    
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'en-US';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      setRecognition(recognitionInstance);
    }
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setSearchResultCount(data.length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredProducts(products);
      setSearchResultCount(products.length);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/ai-search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      setFilteredProducts(results);
      setSearchResultCount(results.length);
    } catch (error) {
      console.error("Search error:", error);
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
      setSearchResultCount(filtered.length);
    } finally {
      setIsSearching(false);
    }
  };

  const startVoiceSearch = () => {
    if (!recognition) {
      alert("Voice search is not supported in your browser. Please use Chrome.");
      return;
    }
    
    setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSearch(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      alert("Could not hear you. Please try again.");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredProducts(products);
    setSearchResultCount(products.length);
    setIsSearching(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/30 to-blue-600/30 py-16">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in-down">
            Our <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Products</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">Discover the latest electronics with AI-powered search</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
              <div className="flex items-center p-1">
                <FaRobot className="absolute left-5 text-purple-400 text-2xl" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="🤖 AI Search: Try 'laptop under $500', 'sale items', 'iPhone', 'audio devices'"
                  className="w-full px-14 py-5 bg-transparent text-white placeholder-gray-400 outline-none text-lg rounded-2xl"
                />
                
                <button
                  onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                  className={`p-3 rounded-full transition-all duration-300 mr-2 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-500/50 hover:bg-purple-500'}`}
                >
                  {isListening ? <FaStop className="text-white text-xl" /> : <FaMicrophone className="text-white text-xl" />}
                </button>
                
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-3 rounded-full bg-gray-500/50 hover:bg-gray-500 transition-all duration-300 mr-2"
                  >
                    <FaTimes className="text-white text-xl" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {isListening && (
            <div className="text-center mt-4 animate-pulse">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-500/20 rounded-full border border-red-500/50">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                <span className="text-red-400 font-medium">🎤 Listening... Speak now!</span>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/20 rounded-full border border-purple-500/50">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-purple-400">🤖 AI is analyzing your search...</span>
              </div>
            </div>
          )}

          {!isSearching && searchQuery && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/20 rounded-full border border-blue-500/50">
                <FaRobot className="text-blue-400" />
                <span className="text-blue-400">AI found {searchResultCount} result{searchResultCount !== 1 ? 's' : ''} for "{searchQuery}"</span>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-purple-400 text-5xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No products found</h3>
            <p className="text-gray-400 mb-6">We couldn't find any products matching your search.</p>
            <button onClick={clearSearch} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                addToCart={addToCart}
                addToFavorites={addToFavorites}
                onClick={() => navigate(`/products/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;