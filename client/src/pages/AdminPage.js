import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/styles.css";
import AISalesDashboard from "../components/AISalesDashboard";
import AICharts from "../components/AICharts";
import { 
  FaBox, FaShoppingBag, FaPlus, FaEdit, FaTrash, FaEye, 
  FaChartLine, FaChartBar, FaRobot, FaCrown, FaSignOutAlt,
  FaTags, FaUsers, FaMoneyBillWave, FaClock, FaTruck, FaTimesCircle,
  FaCheckCircle, FaSpinner, FaCloudUploadAlt, FaImage
} from "react-icons/fa";

const AdminPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [activeSection, setActiveSection] = useState("analytics");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: "",
    quantity: "",
    sale: false
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [adminInfo, setAdminInfo] = useState(null);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeTab === "orders" && adminInfo) {
      fetchOrders();
    }
  }, [activeTab, adminInfo]);

  const checkAuth = () => {
    const token = localStorage.getItem("adminToken");
    const admin = localStorage.getItem("adminInfo");
    
    if (!token || !admin) {
      navigate("/admin/login");
      return;
    }
    
    setAdminInfo(JSON.parse(admin));
    fetchProducts();
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setMessage({ text: "Cannot connect to server.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrderLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/admin/orders", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401 || response.status === 403) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setMessage({ text: "Error fetching orders.", type: "error" });
    } finally {
      setOrderLoading(false);
    }
  };

  // Drag & Drop Image Upload Functions
  const uploadImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setMessage({ text: "Please upload an image file", type: "error" });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image too large. Max 5MB", type: "error" });
      return false;
    }

    setUploadingImage(true);
    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/admin/upload-image", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataImg
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        setMessage({ text: "✅ Image uploaded successfully!", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 2000);
        return true;
      } else {
        setMessage({ text: "Failed to upload image", type: "error" });
        return false;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ text: "Error uploading image", type: "error" });
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image paste (Ctrl+V)
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        await uploadImage(file);
        break;
      }
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  // Handle drop
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    } else {
      setMessage({ text: "Please drop an image file", type: "error" });
    }
  };

  // Handle file select
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setMessage({ text: "Order status updated!", type: "success" });
        fetchOrders();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const deleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Delete order #${orderNumber}?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ text: `Order #${orderNumber} deleted!`, type: "success" });
        setOrders(orders.filter(order => order.id !== orderId));
        if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const archiveOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Mark order #${orderNumber} as delivered?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered' })
      });
      setMessage({ text: `Order #${orderNumber} delivered!`, type: "success" });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error archiving order:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? e.target.checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    try {
      if (!formData.name || !formData.price || !formData.quantity) {
        setMessage({ text: "Fill all required fields", type: "error" });
        return;
      }

      const token = localStorage.getItem("adminToken");
      const url = editingProduct 
        ? `http://localhost:5000/api/admin/products/${editingProduct.id}`
        : "http://localhost:5000/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ text: editingProduct ? "Product updated!" : "Product added!", type: "success" });
        await fetchProducts();
        resetForm();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image || "",
      quantity: product.quantity,
      sale: product.sale === 1 || product.sale === true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
          method: "DELETE",
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setMessage({ text: "Product deleted!", type: "success" });
          fetchProducts();
          setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", image: "", quantity: "", sale: false });
    setEditingProduct(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  const fetchForecast = async () => {
    try {
      setForecastLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/ai/forecast", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setForecastData(data);
      setShowForecastModal(true);
    } catch (error) {
      alert("Failed to fetch forecast");
    } finally {
      setForecastLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.name) {
      alert("Enter product name first");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("http://localhost:5000/api/ai/generate-description", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productName: formData.name, price: formData.price })
      });
      const data = await response.json();
      alert("🤖 AI Generated Description:\n\n" + data.description);
    } catch (error) {
      alert("Error generating description");
    }
  };

  const parseOrderItems = (items) => {
    if (!items) return [];
    try {
      return typeof items === 'string' ? JSON.parse(items) : items;
    } catch {
      return [];
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <FaCheckCircle className="text-green-400" />;
      case 'processing': return <FaSpinner className="text-blue-400 animate-spin" />;
      case 'shipped': return <FaTruck className="text-purple-400" />;
      case 'cancelled': return <FaTimesCircle className="text-red-400" />;
      default: return <FaClock className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;

  if (loading && products.length === 0 && activeTab === "products") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <FaCrown className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-purple-300 text-sm">Manage your store with AI power</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 border border-white/20">
                <span className="text-purple-300 text-sm">Welcome, </span>
                <span className="text-white font-semibold">{adminInfo?.username || "Admin"}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-all duration-300 border border-red-500/30 hover:border-red-500/50">
                <FaSignOutAlt size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Revenue</p>
                <p className="text-white text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaMoneyBillWave className="text-blue-400 text-2xl" />
              </div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Orders</p>
                <p className="text-white text-3xl font-bold">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaShoppingBag className="text-green-400 text-2xl" />
              </div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Products</p>
                <p className="text-white text-3xl font-bold">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaBox className="text-purple-400 text-2xl" />
              </div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Low Stock Items</p>
                <p className="text-white text-3xl font-bold">{lowStockProducts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaTags className="text-orange-400 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-3 mb-8 border-b border-white/20 pb-4">
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "products" 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25" 
                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FaBox /> Products ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "orders" 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25" 
                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FaShoppingBag /> Orders ({orders.length})
          </button>
        </div>

        {/* AI Analytics Section */}
        {activeTab === "products" && (
          <div className="mb-8">
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveSection("analytics")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "analytics" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" 
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                <FaChartLine /> AI Analytics Dashboard
              </button>
              <button
                onClick={() => setActiveSection("charts")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "charts" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" 
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                <FaChartBar /> Charts & Graphs
              </button>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              {activeSection === "analytics" ? <AISalesDashboard /> : <AICharts />}
            </div>
          </div>
        )}

        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl animate-slide-in-right backdrop-blur-md border ${
            message.type === "success" 
              ? "bg-green-500/90 border-green-400 text-white" 
              : "bg-red-500/90 border-red-400 text-white"
          }`}>
            {message.text}
          </div>
        )}

        {/* AI Forecast Modal */}
        {showForecastModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowForecastModal(false)}>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-white text-xl font-bold flex items-center gap-2"><FaRobot className="animate-pulse" /> AI Demand Forecast</h2>
                <button onClick={() => setShowForecastModal(false)} className="text-white hover:text-gray-200 text-3xl leading-none">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                {forecastData.map((item, index) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 transition-all hover:transform hover:-translate-y-0.5 ${
                    item.trend === '📈 High Demand' ? 'border-green-500 bg-green-500/10' : 
                    item.trend === '📊 Steady' ? 'border-yellow-500 bg-yellow-500/10' : 
                    'border-red-500 bg-red-500/10'
                  }`}>
                    <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                      <div>
                        <h3 className="text-white font-bold text-lg">{item.name}</h3>
                        <p className="text-gray-400 text-sm">Sold: {item.total_sold} units</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white text-xl">{item.trend}</span>
                        <p className="text-green-400 text-sm font-semibold">Score: {item.forecast_score}/100</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <p className="text-purple-300 text-sm"><FaRobot className="inline mr-2" /> <span className="font-semibold">AI Recommendation:</span> {item.trend === '📈 High Demand' ? `Order ${item.recommended_stock} units immediately!` : item.trend === '📊 Steady' ? `Keep ${item.recommended_stock} units in stock` : `Consider running a promotion or discount`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedOrder(null)}>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-purple-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">Order #{selectedOrder.order_number}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-white hover:text-gray-200 text-3xl leading-none">&times;</button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2"><FaUsers /> Customer Information</h3>
                  <div className="space-y-1 text-white">
                    <p><span className="text-gray-400 w-24 inline-block">Name:</span> {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                    <p><span className="text-gray-400 w-24 inline-block">Email:</span> {selectedOrder.customer_email}</p>
                    <p><span className="text-gray-400 w-24 inline-block">Phone:</span> {selectedOrder.customer_phone}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3">📦 Shipping Address</h3>
                  <p className="text-white">{selectedOrder.shipping_address}<br/>{selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3">🛒 Order Items</h3>
                  <div className="space-y-2">
                    {parseOrderItems(selectedOrder.items).map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-white">{item.product_name} x {item.quantity}</span>
                        <span className="text-green-400 font-semibold">${item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-5 border border-purple-500/30">
                  <h3 className="text-purple-400 font-semibold mb-3">💰 Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span><span className="text-white">${selectedOrder.subtotal}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Shipping:</span><span className="text-white">${selectedOrder.shipping_cost}</span></div>
                    <div className="flex justify-between pt-2 border-t border-white/20 mt-2"><span className="text-white font-bold">Total:</span><span className="text-green-400 font-bold text-xl">${selectedOrder.total_amount}</span></div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">{getStatusIcon(selectedOrder.order_status)} Order Status</h3>
                  <select value={selectedOrder.order_status} onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)} className={`w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 ${getStatusColor(selectedOrder.order_status)} border`}>
                    <option value="pending" className="bg-gray-800">⏳ Pending</option>
                    <option value="processing" className="bg-gray-800">⚙️ Processing</option>
                    <option value="shipped" className="bg-gray-800">🚚 Shipped</option>
                    <option value="delivered" className="bg-gray-800">✅ Delivered</option>
                    <option value="cancelled" className="bg-gray-800">❌ Cancelled</option>
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => archiveOrder(selectedOrder.id, selectedOrder.order_number)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2">✓ Mark Delivered</button>
                    <button onClick={() => deleteOrder(selectedOrder.id, selectedOrder.order_number)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2">🗑️ Delete Order</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab Content */}
        {activeTab === "products" ? (
          <>
            {/* Add/Edit Product Form */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8 hover:border-purple-500/30 transition-all">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingProduct ? <FaEdit className="text-yellow-400" /> : <FaPlus className="text-green-400" />}
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="Enter product name" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Price ($) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Quantity *</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Sale</label>
                    <label className="flex items-center gap-2 cursor-pointer group mt-2">
                      <input type="checkbox" name="sale" checked={formData.sale} onChange={handleInputChange} className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">🔥 On Sale (-20%)</span>
                    </label>
                  </div>
                </div>

                {/* DRAG & DROP IMAGE UPLOAD SECTION */}
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm mb-2">Product Image</label>
                  
                  {/* Drag & Drop Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
                      ${dragActive 
                        ? "border-purple-500 bg-purple-500/20" 
                        : "border-white/30 bg-white/5 hover:border-purple-500/50 hover:bg-white/10"
                      }
                      ${uploadingImage ? "opacity-50 pointer-events-none" : ""}
                    `}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <FaSpinner className="text-purple-400 text-3xl animate-spin" />
                        <p className="text-white text-sm">Uploading image...</p>
                      </div>
                    ) : formData.image ? (
                      <div className="flex flex-col items-center gap-3">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, image: "" }));
                            }}
                            className="text-red-400 text-sm hover:text-red-300"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="text-purple-400 text-sm hover:text-purple-300"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FaCloudUploadAlt className="text-purple-400 text-4xl" />
                        <p className="text-white font-medium">Drag & Drop image here</p>
                        <p className="text-gray-400 text-sm">or click to browse</p>
                        <p className="text-gray-500 text-xs">Supports: JPG, PNG, GIF, WEBP (Max 5MB)</p>
                        <p className="text-gray-500 text-xs">💡 Tip: You can also Ctrl+V to paste image</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Manual URL input (optional) */}
                  <div className="mt-3">
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="Or paste image URL here"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button type="submit" disabled={uploadingImage} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </button>
                  <button type="button" onClick={generateDescription} className="px-6 py-2.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2">
                    <FaRobot /> AI Description
                  </button>
                  {editingProduct && <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-gray-600/50 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">Cancel</button>}
                </div>
              </form>
            </div>

            {/* Products Table - SAME AS BEFORE */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaBox /> Product List ({products.length})</h2>
                <button onClick={fetchForecast} disabled={forecastLoading} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md">
                  <FaRobot className={forecastLoading ? "animate-pulse" : ""} /> {forecastLoading ? "Analyzing..." : "AI Demand Forecast"}
                </button>
              </div>
              {products.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No products found. Add your first product above!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Product</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Stock</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Sale</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
                          <td className="py-3 px-4 text-white">#{product.id}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white/10" />}
                              <span className="text-white font-medium group-hover:text-purple-400 transition-colors">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-green-400 font-semibold">${parseFloat(product.price).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              product.quantity > 10 ? "bg-green-500/20 text-green-400" : 
                              product.quantity > 0 ? "bg-yellow-500/20 text-yellow-400" : 
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4">{product.sale ? <span className="inline-block px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold animate-pulse">SALE</span> : "-"}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(product)} className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"><FaEdit size={14} /></button>
                              <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"><FaTrash size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          // Orders Tab Content - SAME AS BEFORE
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaShoppingBag /> Orders ({orders.length})</h2>
              <button onClick={fetchOrders} disabled={orderLoading} className="px-5 py-2.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2">
                {orderLoading ? <FaSpinner className="animate-spin" /> : "🔄"} {orderLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {orderLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Order #</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Items</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Total</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const items = parseOrderItems(order.items);
                      return (
                        <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white font-semibold">#{order.order_number}</td>
                          <td className="py-3 px-4">
                            <div className="text-white">{order.customer_first_name} {order.customer_last_name}</div>
                            <div className="text-gray-400 text-xs">{order.customer_email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-white">{items.length} {items.length === 1 ? 'item' : 'items'}</td>
                          <td className="py-3 px-4 text-green-400 font-bold">${parseFloat(order.total_amount).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.order_status)}
                              <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 ${getStatusColor(order.order_status)} border`}>
                                <option value="pending" className="bg-gray-800">Pending</option>
                                <option value="processing" className="bg-gray-800">Processing</option>
                                <option value="shipped" className="bg-gray-800">Shipped</option>
                                <option value="delivered" className="bg-gray-800">Delivered</option>
                                <option value="cancelled" className="bg-gray-800">Cancelled</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition-all text-sm">
                              <FaEye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
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
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
