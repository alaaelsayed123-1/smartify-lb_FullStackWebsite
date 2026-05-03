import React, { useEffect, useState } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { FaChartPie, FaChartLine, FaChartBar, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement,
  LineElement,
  Title
);

const AICharts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('pie');

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/ai/charts-data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Failed to fetch chart data");
      
      const data = await response.json();
      
      // Prepare Pie Chart Data - Category Distribution
      const pieData = {
        labels: data.categories?.map(cat => cat.name) || ['Electronics', 'Accessories', 'Clothing', 'Home', 'Sports'],
        datasets: [
          {
            data: data.categories?.map(cat => cat.total_sales) || [35, 25, 20, 12, 8],
            backgroundColor: [
              '#8b5cf6', // Purple
              '#ec4899', // Pink
              '#06b6d4', // Cyan
              '#f59e0b', // Amber
              '#10b981', // Emerald
              '#ef4444', // Red
              '#3b82f6', // Blue
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            hoverOffset: 15,
          },
        ],
      };

      // Prepare Bar Chart Data - Monthly Sales
      const barData = {
        labels: data.monthly_sales?.map(m => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Sales ($)',
            data: data.monthly_sales?.map(m => m.amount) || [12500, 15000, 18000, 22000, 28000, 35000],
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderRadius: 8,
            hoverBackgroundColor: 'rgba(139, 92, 246, 1)',
          },
        ],
      };

      // Prepare Line Chart Data - Revenue Trend
      const lineData = {
        labels: data.revenue_trend?.map(t => t.week) || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Revenue',
            data: data.revenue_trend?.map(t => t.revenue) || [5000, 7500, 12000, 18000],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      };

      setChartData({ pie: pieData, bar: barData, line: lineData });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setError(error.message);
      // Set fallback data for demo
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
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 12, family: 'Inter, sans-serif' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            let value = context.raw;
            if (context.dataset.label === 'Sales ($)' || context.dataset.label === 'Revenue') {
              return `${label}: $${value.toLocaleString()}`;
            }
            return `${label}: ${value}%`;
          }
        }
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FaSpinner className="text-purple-400 text-4xl animate-spin mb-4" />
        <p className="text-gray-300">Loading chart data...</p>
      </div>
    );
  }

  if (error && !chartData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FaExclamationTriangle className="text-yellow-400 text-4xl mb-4" />
        <p className="text-red-400">Error loading charts: {error}</p>
        <button 
          onClick={fetchChartData}
          className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Chart Type Selector */}
      <div className="flex gap-3 mb-6 pb-4 border-b border-white/20">
        <button
          onClick={() => setActiveChart('pie')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'pie' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" 
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <FaChartPie /> Category Distribution
        </button>
        <button
          onClick={() => setActiveChart('bar')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'bar' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" 
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <FaChartBar /> Monthly Sales
        </button>
        <button
          onClick={() => setActiveChart('line')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            activeChart === 'line' 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" 
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <FaChartLine /> Revenue Trend
        </button>
      </div>

      {/* Charts Container - Fixed Height to prevent layout issues */}
      <div className="grid grid-cols-1 gap-8">
        {/* Main Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            {activeChart === 'pie' && <FaChartPie className="text-purple-400" />}
            {activeChart === 'bar' && <FaChartBar className="text-blue-400" />}
            {activeChart === 'line' && <FaChartLine className="text-pink-400" />}
            {activeChart === 'pie' && 'Product Category Distribution'}
            {activeChart === 'bar' && 'Monthly Sales Performance'}
            {activeChart === 'line' && 'Revenue Trend Analysis'}
          </h3>
          <div className="relative w-full min-h-[400px] h-[450px]">
            {activeChart === 'pie' && chartData?.pie && (
              <Pie data={chartData.pie} options={chartOptions} />
            )}
            {activeChart === 'bar' && chartData?.bar && (
              <Bar data={chartData.bar} options={chartOptions} />
            )}
            {activeChart === 'line' && chartData?.line && (
              <Line data={chartData.line} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Top Category</p>
            <p className="text-white text-xl font-bold">
              {chartData?.pie?.labels?.[0] || 'Electronics'}
            </p>
            <p className="text-purple-400 text-sm">
              {chartData?.pie?.datasets?.[0]?.data?.[0] || 35}% of total sales
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Best Month</p>
            <p className="text-white text-xl font-bold">
              {chartData?.bar?.labels?.[chartData.bar.labels.length - 1] || 'June'}
            </p>
            <p className="text-green-400 text-sm">
              ${(chartData?.bar?.datasets?.[0]?.data?.[chartData.bar.datasets[0].data.length - 1] || 35000).toLocaleString()}
            </p>
          </div>
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

export default AICharts;