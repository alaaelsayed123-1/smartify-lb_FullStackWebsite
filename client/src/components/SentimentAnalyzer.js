import React, { useState } from "react";
import { FaSmile, FaFrown, FaMeh, FaChartLine, FaSpinner } from "react-icons/fa";

const SentimentAnalyzer = ({ productId, productName }) => {
  const [review, setReview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const analyzeSentiment = async () => {
    if (!review.trim()) {
      alert("Please write a review first!");
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/ai/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, productId })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      alert("Failed to analyze sentiment. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <FaSmile size={48} color="#4CAF50" />;
    if (sentiment === 'negative') return <FaFrown size={48} color="#f44336" />;
    return <FaMeh size={48} color="#ff9800" />;
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return "#4CAF50";
    if (sentiment === 'negative') return "#f44336";
    return "#ff9800";
  };

  const getSentimentMessage = (sentiment, score) => {
    if (sentiment === 'positive') {
      if (score > 30) return "🎉 Amazing! Very positive feedback!";
      if (score > 15) return "😊 Great! Customers will love this!";
      return "👍 Good review, keep up the quality!";
    } else if (sentiment === 'negative') {
      if (score < -30) return "😔 Very negative. Immediate attention needed!";
      if (score < -15) return "😕 Negative feedback. Consider improvements.";
      return "🤔 Slightly negative. Review the concerns.";
    }
    return "😐 Neutral review. No strong feelings detected.";
  };

  return (
    <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "30px" }}>
      <button
        onClick={() => setShowAnalyzer(!showAnalyzer)}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: showAnalyzer ? "20px" : "0"
        }}
      >
        <FaChartLine /> 🤖 AI Sentiment Analyzer
      </button>
      
      {showAnalyzer && (
        <div style={{
          background: "rgba(0,0,0,0.6)",
          borderRadius: "12px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ color: "white", marginBottom: "15px" }}>
            🤖 Tell us what you think about {productName}
          </h3>
          
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your honest review here... Our AI will analyze your sentiment and help other customers!"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontSize: "14px",
              resize: "vertical"
            }}
          />
          
          <button
            onClick={analyzeSentiment}
            disabled={analyzing}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: analyzing ? "#666" : "#0a84ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: analyzing ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {analyzing ? <><FaSpinner className="spinner" /> Analyzing...</> : "🔍 Analyze Sentiment"}
          </button>
          
          {result && (
            <div style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ marginBottom: "10px" }}>
                {getSentimentIcon(result.sentiment)}
              </div>
              <h4 style={{ color: getSentimentColor(result.sentiment), marginBottom: "10px", fontSize: "18px" }}>
                {result.sentiment === 'positive' && "😊 Positive Review!"}
                {result.sentiment === 'negative' && "😔 Negative Review"}
                {result.sentiment === 'neutral' && "😐 Neutral Review"}
              </h4>
              
              <p style={{ color: "#ddd", fontSize: "14px", marginBottom: "15px" }}>
                {getSentimentMessage(result.sentiment, result.score)}
              </p>
              
              <div style={{
                width: "100%",
                height: "10px",
                background: "#333",
                borderRadius: "5px",
                overflow: "hidden",
                marginBottom: "15px"
              }}>
                <div style={{
                  width: `${result.confidence}%`,
                  height: "100%",
                  background: result.sentiment === 'positive' ? "#4CAF50" : result.sentiment === 'negative' ? "#f44336" : "#ff9800",
                  transition: "width 0.5s"
                }} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: "#aaa", fontSize: "12px" }}>Confidence: {result.confidence}%</span>
                <span style={{ color: "#aaa", fontSize: "12px" }}>Score: {result.score}</span>
              </div>
              
              {result.matches && result.matches.length > 0 && (
                <div style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {result.matches.slice(0, 5).map((word, i) => (
                    <span key={i} style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      color: "#fff"
                    }}>#{word}</span>
                  ))}
                </div>
              )}
              
              <p style={{ color: "#aaa", fontSize: "12px", marginTop: "15px" }}>
                {result.sentiment === 'positive' && "🎉 Thank you for your positive feedback! This helps other customers trust our products."}
                {result.sentiment === 'negative' && "😟 We're sorry to hear that. Your feedback helps us improve!"}
                {result.sentiment === 'neutral' && "📝 Thank you for your honest feedback!"}
              </p>
            </div>
          )}
          
          <style>{`
            .spinner {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalyzer;