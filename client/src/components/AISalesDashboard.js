import React, { useState, useEffect } from "react";
import { FaChartLine, FaDollarSign, FaShoppingCart, FaUsers, FaTachometerAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

const AISalesDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("revenue");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/ai/sales-analysis", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSalesData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSalesData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Also listen for order placed events (you can trigger this from checkout)
  useEffect(() => {
    const handleOrderPlaced = () => {
      fetchSalesData();
    };
    
    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Loading AI Sales Dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(...(data.monthlySales?.map(m => parseFloat(m.total_revenue)) || [0]));
  const maxOrders = Math.max(...(data.monthlySales?.map(m => m.order_count) || [0]));

  return (
    <div style={{ marginBottom: "40px" }}>
      {/* Last Updated Timestamp */}
      <div style={{ textAlign: "right", fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        Last updated: {lastUpdated.toLocaleTimeString()} (auto-refreshes every 30s)
      </div>
      
      {/* AI Summary Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "20px", 
        marginBottom: "30px" 
      }}>
        <div style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Total Revenue</p>
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>${parseFloat(data.totalRevenue || 0).toFixed(2)}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 6 months</p>
            </div>
            <FaDollarSign size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        <div style={{ 
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", 
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Total Orders</p>
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>{data.totalOrders || 0}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 6 months</p>
            </div>
            <FaShoppingCart size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        <div style={{ 
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", 
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Avg Daily Revenue</p>
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>${parseFloat(data.analytics?.avgDailyRevenue || 0).toFixed(2)}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 30 days</p>
            </div>
            <FaTachometerAlt size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        <div style={{ 
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", 
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Returning Customers</p>
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>{data.analytics?.returningCustomerRate || 0}%</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Customer loyalty rate</p>
            </div>
            <FaUsers size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>
      
      {/* Monthly Sales Chart */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaChartLine /> 📊 Monthly Sales Performance
        </h3>
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <button 
            onClick={() => setActiveMetric("revenue")}
            style={{
              padding: "8px 16px",
              background: activeMetric === "revenue" ? "#4CAF50" : "#f0f0f0",
              color: activeMetric === "revenue" ? "white" : "#333",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >Revenue</button>
          <button 
            onClick={() => setActiveMetric("orders")}
            style={{
              padding: "8px 16px",
              background: activeMetric === "orders" ? "#4CAF50" : "#f0f0f0",
              color: activeMetric === "orders" ? "white" : "#333",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >Orders</button>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "30px", alignItems: "flex-end", minWidth: "500px", padding: "20px 0" }}>
            {(data.monthlySales || []).map((month, idx) => {
              const value = activeMetric === "revenue" ? parseFloat(month.total_revenue) : month.order_count;
              const max = activeMetric === "revenue" ? maxRevenue : maxOrders;
              const height = max > 0 ? (value / max) * 200 : 0;
              return (
                <div key={idx} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    height: `${height}px`,
                    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                    width: "100%",
                    borderRadius: "8px 8px 0 0",
                    transition: "height 0.5s",
                    marginBottom: "8px"
                  }} />
                  <p style={{ fontSize: "12px", margin: 0 }}>{month.month}</p>
                  <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>
                    {activeMetric === "revenue" ? `$${value.toFixed(0)}` : value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Top Products */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginBottom: "20px" }}>🏆 Top Selling Products</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Units Sold</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Revenue</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Performance</th>
               </tr>
            </thead>
            <tbody>
              {(data.topProducts || []).map((product, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{product.name}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{product.total_sold}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>${parseFloat(product.total_revenue).toFixed(2)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "20px",
                      background: idx === 0 ? "#4CAF50" : idx === 1 ? "#ff9800" : "#2196F3",
                      color: "white",
                      fontSize: "12px"
                    }}>
                      {idx === 0 ? "🥇 Best Seller" : idx === 1 ? "🥈 Runner Up" : "📈 Popular"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Category Sales */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginBottom: "20px" }}>📂 Sales by Category</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          {(data.categorySales || []).map((cat, idx) => (
            <div key={idx} style={{
              padding: "15px",
              background: "#f8f9fa",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <h4 style={{ margin: "0 0 10px 0" }}>{cat.name}</h4>
              <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", color: "#4CAF50" }}>{cat.sold}</p>
              <p style={{ fontSize: "12px", color: "#666", margin: "5px 0 0 0" }}>units sold</p>
              <p style={{ fontSize: "14px", color: "#333", margin: "5px 0 0 0" }}>${parseFloat(cat.revenue).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Insights */}
      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", 
        borderRadius: "12px", 
        padding: "20px",
        color: "white"
      }}>
        <h3 style={{ marginBottom: "15px" }}>🤖 AI Business Insights</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Best Performing Day</p>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.bestDay || "N/A"}</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>${parseFloat(data.analytics?.bestDayRevenue || 0).toFixed(0)} revenue</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Customer Retention</p>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.returningCustomerRate || 0}%</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>returning customers</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Low Stock Alert</p>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.lowStock?.length || 0} products</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>need restocking soon</p>
          </div>
        </div>
        
        {data.analytics?.lowStock?.length > 0 && (
          <div style={{ marginTop: "15px", padding: "12px", background: "rgba(255,107,107,0.2)", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "14px" }}>
              ⚠️ Low Stock Alert: {data.analytics.lowStock.map(p => `${p.name} (${p.quantity} left)`).join(", ")}
            </p>
          </div>
        )}
        
        <div style={{ marginTop: "15px", padding: "12px", background: "rgba(76,175,80,0.2)", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            💡 AI Recommendation: {data.analytics?.bestDay === "Friday" ? "Weekend is approaching! Increase marketing budget for Friday promotions." : "Focus on improving customer retention to increase returning customer rate."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISalesDashboard;