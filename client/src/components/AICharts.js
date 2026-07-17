// Import React and hooks from React library
// useEffect: For handling side effects like data fetching when component mounts
// useState: For managing component state (chart data, loading, error, active chart)
import React, { useEffect, useState } from 'react';

// Import chart components from react-chartjs-2 library
// Pie: Renders pie/doughnut charts
// Bar: Renders bar charts
// Line: Renders line charts
import { Pie, Bar, Line } from 'react-chartjs-2';

// Import ChartJS core components needed for the charts to work
// These are the building blocks that ChartJS needs to render different chart types
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';

// Import icons from react-icons for visual elements in the UI
// FaChartPie: Icon for pie chart selection button
// FaChartLine: Icon for line chart selection button
// FaChartBar: Icon for bar chart selection button
// FaSpinner: Spinner icon for loading state
// FaExclamationTriangle: Warning icon for error state
import { FaChartPie, FaChartLine, FaChartBar, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// Register ChartJS components - this is REQUIRED for ChartJS v4+
// Each component enables specific functionality:
ChartJS.register(
  ArcElement,      // Required for Pie/Doughnut charts
  Tooltip,         // Enables hover tooltips on charts
  Legend,          // Enables chart legends
  CategoryScale,   // Required for category axes (bar/line charts)
  LinearScale,     // Required for linear/numerical axes
  BarElement,      // Required for bar chart rendering
  PointElement,    // Required for point markers on line charts
  LineElement,     // Required for line chart rendering
  Title            // Enables chart titles
);

// Main AICharts functional component - displays interactive sales charts
const AICharts = () => {
  // State to store all three chart data configurations (pie, bar, line)
  // Initially null until data is fetched
  const [chartData, setChartData] = useState(null);
  
  // Loading state to track if data is being fetched
  // Starts as true to show loading indicator on initial render
  const [loading, setLoading] = useState(true);
  
  // Error state to store error messages if data fetching fails
  // Initially null (no errors)
  const [error, setError] = useState(null);
  
  // Active chart state to track which chart type is currently selected
  // Default is 'pie' chart view
  const [activeChart, setActiveChart] = useState('pie');

  // useEffect hook: Runs once when component mounts (empty dependency array [])
  // Triggers the initial data fetch
  useEffect(() => {
    fetchChartData();
  }, []);

  // Asynchronous function to fetch chart data from the backend API
  const fetchChartData = async () => {
    try {
      // Set loading to true before starting the fetch
      setLoading(true);
      
      // Get admin authentication token from localStorage
      // This token is required for authorized API access
      const token = localStorage.getItem("adminToken");
      
      // Make GET request to the AI charts data endpoint
      const response = await fetch("http://localhost:5000/api/ai/charts-data", {
        headers: { Authorization: `Bearer ${token}` }  // Pass token in Authorization header
      });
      
      // Check if the response was successful (status code 200-299)
      // If not, throw an error to be caught by the catch block
      if (!response.ok) throw new Error("Failed to fetch chart data");
      
      // Parse the JSON response body into a JavaScript object
      const data = await response.json();
      
      // Prepare Pie Chart Data - Category Distribution
      // This chart shows how sales are distributed across product categories
      const pieData = {
        // Extract category names for labels, or use default labels if no data
          labels: data.categories?.map(cat => cat.name) || ['Electronics', 'Accessories', 'Clothing', 'Home', 'Sports'],
          datasets: [
          {
            // Extract total sales values for each category, or use default values
            data: data.categories?.map(cat => cat.total_sales) || [35, 25, 20, 12, 8],
            // Array of colors for each pie slice
            backgroundColor: [
              '#8b5cf6', // Purple
              '#ec4899', // Pink
              '#06b6d4', // Cyan
              '#f59e0b', // Amber
              '#10b981', // Emerald
              '#ef4444', // Red
              '#3b82f6', // Blue
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',  // Semi-transparent white borders
            borderWidth: 2,  // Border thickness between slices
            hoverOffset: 15,  // How much slices expand on hover (creates nice effect)
          },
        ],
      };

      // Prepare Bar Chart Data - Monthly Sales
      // This chart shows sales amounts for each month
      const barData = {
        // Extract month names for X-axis labels, or use default months
        labels: data.monthly_sales?.map(m => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Sales ($)',  // Dataset label shown in tooltips and legend
            // Extract sales amounts, or use default values
            data: data.monthly_sales?.map(m => m.amount) || [12500, 15000, 18000, 22000, 28000, 35000],
            backgroundColor: 'rgba(139, 92, 246, 0.8)',  // Purple with 80% opacity
            borderRadius: 8,  // Rounded corners on bars
            hoverBackgroundColor: 'rgba(139, 92, 246, 1)',  // Solid purple on hover
          },
        ],
      };

      // Prepare Line Chart Data - Revenue Trend
      // This chart shows revenue progression over weeks
      const lineData = {
        // Extract week labels for X-axis, or use default weeks
        labels: data.revenue_trend?.map(t => t.week) || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Revenue',  // Dataset label
            // Extract revenue values, or use default values
            data: data.revenue_trend?.map(t => t.revenue) || [5000, 7500, 12000, 18000],
            borderColor: '#ec4899',  // Pink line color
            backgroundColor: 'rgba(236, 72, 153, 0.1)',  // Light pink fill below line
            tension: 0.4,  // Curve tension (0 = straight lines, 1 = very curved)
            fill: true,  // Fill the area under the line
            pointBackgroundColor: '#8b5cf6',  // Purple dots on data points
            pointBorderColor: '#fff',  // White border around dots
            pointBorderWidth: 2,  // Border thickness around dots
            pointRadius: 6,  // Size of data point dots
            pointHoverRadius: 8,  // Size of dots when hovered (larger)
          },
        ],
      };

      // Update state with all three chart configurations
      setChartData({ pie: pieData, bar: barData, line: lineData });
    } catch (error) {
      // Log error to console for debugging
      console.error("Error fetching chart data:", error);
      
      // Store the error message in state for display
      setError(error.message);
      
      // Set fallback data for demo purposes when API fails
      // This ensures the dashboard still shows something useful
      setChartData({
        pie: {
          labels: ['Electronics', 'Accessories', 'Clothing', 'Home', 'Sports'],
          datasets: [{ data: [35, 25, 20, 12, 8], backgroundColor: ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'], borderWidth: 2 }]
        },
        bar: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{ label: 'Sales ($)', data: [12500, 15000, 18000, 22000, 28000, 35000], backgroundColor: '#8b5cf6', borderRadius: 8 }]
        },
        line: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{ label: 'Revenue', data: [5000, 7500, 12000, 18000], borderColor: '#ec4899', tension: 0.4, fill: true }]
        }
      });
    } finally {
      // Always set loading to false when done (whether success or failure)
      setLoading(false);
    }
  };

  // Chart configuration options applied to all chart types
  const chartOptions = {
    responsive: true,  // Chart resizes with container
    maintainAspectRatio: false,  // Don't maintain aspect ratio (allows custom height)
    plugins: {
      legend: {
        position: 'bottom',  // Place legend below the chart
        labels: {
          color: '#cbd5e1',  // Light gray text color for legend
          font: { size: 12, family: 'Inter, sans-serif' },  // Font styling for legend
          usePointStyle: true,  // Use circular points instead of rectangles
          pointStyle: 'circle',  // Circle style for legend indicators
          padding: 15,  // Space between legend items
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',  // Dark semi-transparent tooltip background
        titleColor: '#fff',  // White title text in tooltip
        bodyColor: '#cbd5e1',  // Light gray body text
        borderColor: '#8b5cf6',  // Purple border on tooltip
        borderWidth: 1,  // Tooltip border thickness
        padding: 12,  // Inner padding of tooltip
        cornerRadius: 8,  // Rounded corners on tooltip
        displayColors: true,  // Show color indicators in tooltip
        callbacks: {
          // Custom label formatting function for tooltips
          label: function(context) {
            let label = context.dataset.label || '';  // Get dataset label
            let value = context.raw;  // Get the raw data value
            
            // Format currency values with $ and locale string for Sales/Revenue
            if (context.dataset.label === 'Sales ($)' || context.dataset.label === 'Revenue') {
              return `${label}: $${value.toLocaleString()}`;  // Format as currency (e.g., $12,500)
            }
            // Format percentage values for other datasets
            return `${label}: ${value}%`;  // Format as percentage (e.g., 35%)
          }
        }
      },
    },
    layout: {
      padding: {
        top: 20,     // Space above the chart
        bottom: 10,  // Space below the chart
        left: 10,    // Space to the left
        right: 10,   // Space to the right
      },
    },
  };

  // Conditional rendering: Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {/* Animated spinning icon */}
        <FaSpinner className="text-purple-400 text-4xl animate-spin mb-4" />
        <p className="text-gray-300">Loading chart data...</p>
      </div>
    );
  }

  // Conditional rendering: Show error message if there's an error and no chart data
  if (error && !chartData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {/* Warning triangle icon */}
        <FaExclamationTriangle className="text-yellow-400 text-4xl mb-4" />
        <p className="text-red-400">Error loading charts: {error}</p>
        {/* Retry button that calls fetchChartData again */}
        <button 
          onClick={fetchChartData}
          className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main render: Display the chart dashboard
  return (
    <div className="space-y-8">
      {/* Chart Type Selector - Buttons to switch between chart types */}
      <div className="flex gap-3 mb-6 pb-4 border-b border-white/20">
        {/* Pie Chart button */}
        <button
          onClick={() => setActiveChart('pie')}  // Set active chart to pie
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'pie' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"  // Active state styling
              : "bg-white/10 text-gray-300 hover:bg-white/20"  // Inactive state styling
          }`}
        >
          <FaChartPie /> Category Distribution
        </button>
        
        {/* Bar Chart button */}
        <button
          onClick={() => setActiveChart('bar')}  // Set active chart to bar
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'bar' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"  // Active state
              : "bg-white/10 text-gray-300 hover:bg-white/20"  // Inactive state
          }`}
        >
          <FaChartBar /> Monthly Sales
        </button>
        
        {/* Line Chart button */}
        <button
          onClick={() => setActiveChart('line')}  // Set active chart to line
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'line' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"  // Active state
              : "bg-white/10 text-gray-300 hover:bg-white/20"  // Inactive state
          }`}
        >
          <FaChartLine /> Revenue Trend
        </button>
      </div>

      {/* Charts Container - Fixed Height to prevent layout issues */}
      <div className="grid grid-cols-1 gap-8">
        {/* Main Chart display area */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          {/* Dynamic title based on active chart type */}
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            {/* Show pie icon when pie chart is active */}
            {activeChart === 'pie' && <FaChartPie className="text-purple-400" />}
            {/* Show bar icon when bar chart is active */}
            {activeChart === 'bar' && <FaChartBar className="text-blue-400" />}
            {/* Show line icon when line chart is active */}
            {activeChart === 'line' && <FaChartLine className="text-pink-400" />}
            {/* Dynamic title text based on active chart */}
            {activeChart === 'pie' && 'Product Category Distribution'}
            {activeChart === 'bar' && 'Monthly Sales Performance'}
            {activeChart === 'line' && 'Revenue Trend Analysis'}
          </h3>
          
          {/* Chart container with fixed height */}
          <div className="relative w-full min-h-[400px] h-[450px]">
            {/* Conditionally render Pie chart when active */}
            {activeChart === 'pie' && chartData?.pie && (
              <Pie data={chartData.pie} options={chartOptions} />
            )}
            {/* Conditionally render Bar chart when active */}
            {activeChart === 'bar' && chartData?.bar && (
              <Bar data={chartData.bar} options={chartOptions} />
            )}
            {/* Conditionally render Line chart when active */}
            {activeChart === 'line' && chartData?.line && (
              <Line data={chartData.line} options={chartOptions} />
            )}
          </div>
        </div>
        
            // Cards

        {/* Summary Stats - Three cards showing key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Category Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Top Category</p>
            <p className="text-white text-xl font-bold">
              {/* Show top category name (first in array) or default */}
              {chartData?.pie?.labels?.[0] || 'Electronics'}
            </p>
            <p className="text-purple-400 text-sm">
              {/* Show top category percentage or default */}
              {chartData?.pie?.datasets?.[0]?.data?.[0] || 35}% of total sales
            </p>
          </div>
          
          {/* Best Month Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Best Month</p>
            <p className="text-white text-xl font-bold">
              {/* Show last month in the array as best month, or default */}
              {chartData?.bar?.labels?.[chartData.bar.labels.length - 1] || 'June'}
            </p>
            <p className="text-green-400 text-sm">
              {/* Show sales amount for best month with locale formatting (e.g., 35,000) */}
              ${(chartData?.bar?.datasets?.[0]?.data?.[chartData.bar.datasets[0].data.length - 1] || 35000).toLocaleString()}
            </p>
          </div>
          
          {/* Growth Rate Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Growth Rate</p>
            <p className="text-white text-xl font-bold">+42%</p>
            <p className="text-green-400 text-sm">vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the AICharts component as the default export
// This allows it to be imported in other files: import AICharts from './AICharts'
export default AICharts;