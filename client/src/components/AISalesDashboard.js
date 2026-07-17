// Import React library along with useState and useEffect hooks
// useState: Allows functional components to manage state
// useEffect: Handles side effects like data fetching and event listeners
import React, { useState, useEffect } from "react";

// Import specific icons from react-icons/fa package for dashboard visual elements
// FaChartLine: Chart icon for sales performance section
// FaDollarSign: Currency icon for revenue display
// FaShoppingCart: Cart icon for orders
// FaUsers: People icon for customer metrics
// FaTachometerAlt: Speedometer icon for average daily revenue
// FaArrowUp, FaArrowDown: Arrow icons (imported but not used in this component)
import { FaChartLine, FaDollarSign, FaShoppingCart, FaUsers, FaTachometerAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

// Define the main AISalesDashboard functional component
const AISalesDashboard = () => {
  // State variable 'data' to store the fetched sales analysis data, initial value is null
  const [data, setData] = useState(null);
  // State variable 'loading' to track if data is being fetched, starts as true
  const [loading, setLoading] = useState(true);
  // State variable 'activeMetric' to toggle between "revenue" and "orders" view in chart, defaults to "revenue"
  const [activeMetric, setActiveMetric] = useState("revenue");
  // State variable 'lastUpdated' to store the timestamp of last data refresh, initialized to current date/time
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Asynchronous function to fetch sales data from the backend API
  const fetchSalesData = async () => {
    try {
      // Get the admin authentication token from browser's localStorage
      const token = localStorage.getItem("adminToken");
      // Make a GET request to the AI sales analysis endpoint with authorization header
      const response = await fetch("http://localhost:5000/api/ai/sales-analysis", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Parse the JSON response into a JavaScript object
      const result = await response.json();
      // Update the data state with the fetched results
      setData(result);
      // Update the lastUpdated state to current date/time after successful fetch
      setLastUpdated(new Date());
    } catch (error) {
      // Log any errors that occur during the fetch process to the console
      console.error("Error fetching sales data:", error);
    } finally {
      // Regardless of success or failure, set loading to false to hide loading indicator
      setLoading(false);
    }
  };

  // Initial load
  // useEffect runs once when component mounts (empty dependency array [])
  useEffect(() => {
    // Call fetchSalesData immediately when component first loads
    fetchSalesData();
    
    // Auto-refresh every 30 seconds
    // Set up an interval that calls fetchSalesData every 30 seconds
    const interval = setInterval(() => {
      fetchSalesData();
    }, 30000); // Refresh every 30 seconds - 30000 milliseconds
    
    // Cleanup function: clear the interval when component unmounts to prevent memory leaks (stops when leaving the page)
    return () => clearInterval(interval);
  }, []);

  // Also listen for order placed events (you can trigger this from checkout)
  // useEffect runs once when component mounts (empty dependency array [])
  useEffect(() => {
    // Define the event handler function that fetches sales data when order is placed
    // When someone yells "orderPlaced!", the guard runs this function
    const handleOrderPlaced = () => {
      fetchSalesData();  // "Go refresh the sales numbers!"
    };
    
    // Add event listener for custom 'orderPlaced' event on the window object
    //// This is the "security guard" - waiting and listening
    window.addEventListener('orderPlaced', handleOrderPlaced);
    // Cleanup function: remove the event listener when component unmounts when leaving the page
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
  }, []);

  // Conditional rendering: if still loading, show loading message 
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Loading AI Sales Dashboard...</p>
      </div>
    );
  }

  // Conditional rendering: if no data is available (null), return null (render nothing)
  if (!data) return null;

  // Calculate the maximum revenue from monthly sales for scaling the chart bars
  // Uses optional chaining (?.) to safely access monthlySales array
  // parseFloat converts revenue strings to numbers for comparison
  // || [0] provides a fallback array to prevent Math.max from receiving an empty array
  const maxRevenue = Math.max(...(data.monthlySales?.map(m => parseFloat(m.total_revenue)) || [0]));
  // Calculate the maximum order count from monthly sales for scaling the chart bars
  // Gets the highest order_count value across all months
  const maxOrders = Math.max(...(data.monthlySales?.map(m => m.order_count) || [0]));

  // Main return statement rendering the complete dashboard UI
  return (
    <div style={{ marginBottom: "40px" }}>
      {/* Last Updated Timestamp */}
      {/* Display when the data was last refreshed and the auto-refresh interval */}
      <div style={{ textAlign: "right", fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        {/* toLocaleTimeString() converts the date object to a localized time string */}
        Last updated: {lastUpdated.toLocaleTimeString()} (auto-refreshes every 30s)
      </div>
      
      {/* AI Summary Cards */}
      {/* Responsive grid layout for key performance indicator cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", // Creates responsive columns
        gap: "20px", 
        marginBottom: "30px" 
      }}>
        {/* Total Revenue Card with purple gradient background */}
        <div style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Diagonal purple gradient
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          {/* Flex container for horizontal layout: text left, icon right */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Total Revenue</p>
              {/* Display total revenue formatted with 2 decimal places and $ sign */}
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>${parseFloat(data.totalRevenue || 0).toFixed(2)}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 6 months</p>
            </div>
            {/* Dollar sign icon with reduced opacity for visual effect */}
            <FaDollarSign size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        {/* Total Orders Card with pink gradient background */}
        <div style={{ 
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink to coral gradient
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Total Orders</p>
              {/* Display total orders or 0 if not available */}
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>{data.totalOrders || 0}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 6 months</p>
            </div>
            {/* Shopping cart icon */}
            <FaShoppingCart size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        {/* Average Daily Revenue Card with blue gradient background */}
        <div style={{ 
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue to cyan gradient
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Avg Daily Revenue</p>
              {/* Display average daily revenue from analytics, with safe access using optional chaining */}
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>${parseFloat(data.analytics?.avgDailyRevenue || 0).toFixed(2)}</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Last 30 days</p>
            </div>
            {/* Speedometer icon */}
            <FaTachometerAlt size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
        
        {/* Returning Customers Card with green gradient background */}
        <div style={{ 
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green to teal gradient
          padding: "20px", 
          borderRadius: "12px", 
          color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>Returning Customers</p>
              {/* Display returning customer rate percentage with % symbol */}
              <h2 style={{ fontSize: "28px", margin: "5px 0" }}>{data.analytics?.returningCustomerRate || 0}%</h2>
              <p style={{ fontSize: "12px", opacity: 0.8 }}>Customer loyalty rate</p>
            </div>
            {/* Users icon */}
            <FaUsers size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>
      
      {/* Monthly Sales Chart */}
      {/* Section displaying bar chart of monthly sales data */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {/* Chart title with chart line icon and emoji */}
        <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaChartLine /> 📊 Monthly Sales Performance
        </h3>
        {/* Toggle buttons to switch between Revenue and Orders view */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          {/* Revenue toggle button - changes color based on activeMetric state */}
          <button 
            onClick={() => setActiveMetric("revenue")} // Set activeMetric to "revenue" when clicked
            style={{
              padding: "8px 16px",
              // Green background when active, gray when inactive
              background: activeMetric === "revenue" ? "#4CAF50" : "#f0f0f0",
              // White text when active, dark text when inactive
              color: activeMetric === "revenue" ? "white" : "#333",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >Revenue</button>
          {/* Orders toggle button - changes color based on activeMetric state */}
          <button 
            onClick={() => setActiveMetric("orders")} // Set activeMetric to "orders" when clicked
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
        
        {/* Bar chart container with horizontal scroll for small screens */}
        <div style={{ overflowX: "auto" }}>
          {/* Flex container for bars, aligned at bottom for chart effect */}
          <div style={{ display: "flex", gap: "30px", alignItems: "flex-end", minWidth: "500px", padding: "20px 0" }}>
            {/* Map through monthly sales data to create bars */}
            {(data.monthlySales || []).map((month, idx) => {
              // Determine the value to display based on active metric (revenue or orders)
              const value = activeMetric === "revenue" ? parseFloat(month.total_revenue) : month.order_count;
              // Get the maximum value for scaling (revenue or orders)
              const max = activeMetric === "revenue" ? maxRevenue : maxOrders;
              // Calculate bar height as percentage of maximum (200px max height)
              const height = max > 0 ? (value / max) * 200 : 0;
              return (
                <div key={idx} style={{ textAlign: "center", flex: 1 }}>
                  {/* The bar element with dynamic height */}
                  <div style={{
                    height: `${height}px`, // Dynamic height based on calculation
                    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)", // Vertical gradient
                    width: "100%",
                    borderRadius: "8px 8px 0 0", // Rounded only at top
                    transition: "height 0.5s", // Smooth height animation when switching metrics
                    marginBottom: "8px"
                  }} />
                  {/* Month label (e.g., "Jan", "Feb") */}
                  <p style={{ fontSize: "12px", margin: 0 }}>{month.month}</p>
                  {/* Value label - shows $ amount for revenue or number for orders */}
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
      {/* Table displaying the best selling products */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginBottom: "20px" }}>🏆 Top Selling Products</h3>
        {/* Horizontal scroll container for table responsiveness */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {/* Table header */}
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Units Sold</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Revenue</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Performance</th>
               </tr>
            </thead>
            {/* Table body with product data */}
            <tbody>
              {/* Map through topProducts array, render each product as a row */}
              {(data.topProducts || []).map((product, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{product.name}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{product.total_sold}</td>
                  {/* Parse revenue string to float and format with 2 decimal places */}
                  <td style={{ padding: "12px", textAlign: "right" }}>${parseFloat(product.total_revenue).toFixed(2)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {/* Performance badge with different colors and emojis based on rank */}
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "20px",
                      // Green for 1st place, orange for 2nd, blue for others
                      background: idx === 0 ? "#4CAF50" : idx === 1 ? "#ff9800" : "#2196F3",
                      color: "white",
                      fontSize: "12px"
                    }}>
                      {/* Display appropriate badge text based on product rank */}
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
      {/* Grid displaying sales breakdown by product category */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "20px", 
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginBottom: "20px" }}>📂 Sales by Category</h3>
        {/* Responsive grid for category cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          {/* Map through category sales data */}
          {(data.categorySales || []).map((cat, idx) => (
            <div key={idx} style={{
              padding: "15px",
              background: "#f8f9fa", // Light gray background for cards
              borderRadius: "8px",
              textAlign: "center"
            }}>
              {/* Category name */}
              <h4 style={{ margin: "0 0 10px 0" }}>{cat.name}</h4>
              {/* Units sold number in prominent green */}
              <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", color: "#4CAF50" }}>{cat.sold}</p>
              <p style={{ fontSize: "12px", color: "#666", margin: "5px 0 0 0" }}>units sold</p>
              {/* Revenue amount formatted to whole dollars */}
              <p style={{ fontSize: "14px", color: "#333", margin: "5px 0 0 0" }}>${parseFloat(cat.revenue).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Insights */}
      {/* Section displaying AI-generated business insights and recommendations */}
      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", // Dark gradient for premium AI feel
        borderRadius: "12px", 
        padding: "20px",
        color: "white"
      }}>
        <h3 style={{ marginBottom: "15px" }}>🤖 AI Business Insights</h3>
        {/* Grid layout for insight cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          {/* Best performing day insight */}
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Best Performing Day</p>
            {/* Display best day or "N/A" if not available */}
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.bestDay || "N/A"}</p>
            {/* Display revenue for best day */}
            <p style={{ fontSize: "12px", opacity: 0.7 }}>${parseFloat(data.analytics?.bestDayRevenue || 0).toFixed(0)} revenue</p>
          </div>
          {/* Customer retention insight */}
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Customer Retention</p>
            {/* Display returning customer rate percentage */}
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.returningCustomerRate || 0}%</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>returning customers</p>
          </div>
          {/* Low stock alert insight */}
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Low Stock Alert</p>
            {/* Display count of low stock products */}
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{data.analytics?.lowStock?.length || 0} products</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>need restocking soon</p>
          </div>
        </div>
        
        {/* Conditional rendering: only show low stock alert if there are low stock products */}
        {data.analytics?.lowStock?.length > 0 && (
          <div style={{ marginTop: "15px", padding: "12px", background: "rgba(255,107,107,0.2)", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {/* Display warning with list of low stock products and their quantities */}
              ⚠️ Low Stock Alert: {data.analytics.lowStock.map(p => `${p.name} (${p.quantity} left)`).join(", ")}
            </p>
          </div>
        )}
        
        {/* AI Recommendation section with green-tinted background */}
        <div style={{ marginTop: "15px", padding: "12px", background: "rgba(76,175,80,0.2)", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {/* Display contextual AI recommendation based on best performing day */}
            💡 AI Recommendation: {data.analytics?.bestDay === "Friday" ? "Weekend is approaching! Increase marketing budget for Friday promotions." : "Focus on improving customer retention to increase returning customer rate."}
          </p>
        </div>
      </div>
    </div>
  );
};

// Export the AISalesDashboard component as the default export
export default AISalesDashboard;