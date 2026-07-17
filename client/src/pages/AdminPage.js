// Import React core hooks and router for navigation
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Import global CSS styles
import "../styles/styles.css";
// Import AI-powered dashboard components for analytics and charts
import AISalesDashboard from "../components/AISalesDashboard";
import AICharts from "../components/AICharts";
// Import icons from react-icons for visual elements
import { 
  FaBox, FaShoppingBag, FaPlus, FaEdit, FaTrash, FaEye, 
  FaChartLine, FaChartBar, FaRobot, FaCrown, FaSignOutAlt,
  FaTags, FaUsers, FaMoneyBillWave, FaClock, FaTruck, FaTimesCircle,
  FaCheckCircle, FaSpinner, FaCloudUploadAlt, FaImage
} from "react-icons/fa";

// Main AdminPage component - the complete admin dashboard
const AdminPage = () => {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // State for storing all products from the database
  const [products, setProducts] = useState([]);
  // State for storing all customer orders
  const [orders, setOrders] = useState([]);
  // Loading state for products table
  const [loading, setLoading] = useState(true);
  // Loading state for orders table (separate for better UX)
  const [orderLoading, setOrderLoading] = useState(false);
  // Tracks which product is being edited (null means adding new)
  const [editingProduct, setEditingProduct] = useState(null);
  // Tracks which order is selected for viewing details
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Controls which main tab is active: products or orders
  const [activeTab, setActiveTab] = useState("products");
  // Controls which analytics section is shown: analytics or charts
  const [activeSection, setActiveSection] = useState("analytics");
  // Loading state for image upload process
  const [uploadingImage, setUploadingImage] = useState(false);
  // Tracks if user is actively dragging a file over the drop zone
  const [dragActive, setDragActive] = useState(false);
  // Reference to the hidden file input element for programmatic clicks
  const fileInputRef = useRef(null);
  // Form state for adding/editing products
  const [formData, setFormData] = useState({
    name: "",       // Product name input
    price: "",      // Product price input
    image: "",      // Product image URL/path
    quantity: "",   // Stock quantity input
    sale: false     // Whether product is on sale (checkbox)
  });
  // State for showing success/error messages to admin
  const [message, setMessage] = useState({ text: "", type: "" });
  // Stores logged-in admin user information from localStorage
  const [adminInfo, setAdminInfo] = useState(null);
  // Controls visibility of AI demand forecast modal
  const [showForecastModal, setShowForecastModal] = useState(false);
  // Stores forecast data received from AI endpoint
  const [forecastData, setForecastData] = useState([]);
  // Loading state for forecast data fetch
  const [forecastLoading, setForecastLoading] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch orders when orders tab becomes active AND admin is authenticated
// Fetch orders immediately when admin is authenticated
useEffect(() => {
    if (adminInfo) {
      fetchOrders();
    }
  }, [adminInfo]);

  // Verifies admin token exists in localStorage, redirects to login if missing
  const checkAuth = () => {
    // Get admin token from browser storage
    const token = localStorage.getItem("adminToken");
    // Get admin info from browser storage
    const admin = localStorage.getItem("adminInfo");
    
    // If either token or admin info is missing, redirect to login page
    if (!token || !admin) {
      navigate("/admin/login");
      return;
    }
    
    // Parse admin info from JSON string and set in state
    setAdminInfo(JSON.parse(admin));
    // Load products after authentication is confirmed
    fetchProducts();
  };

  // Fetches all products from the backend API
  const fetchProducts = async () => {
    try {
      // Show loading spinner while fetching
      setLoading(true);
      // Make GET request to products endpoint
      const response = await fetch("http://localhost:5000/api/products");
      // Parse JSON response into JavaScript object
      const data = await response.json();
      // Update products state with fetched data
      setProducts(data);
    } catch (error) {
      // Log error for debugging
      console.error("Error fetching products:", error);
      // Show error message to admin
      setMessage({ text: "Cannot connect to server.", type: "error" });
    } finally {
      // Hide loading spinner regardless of success/failure
      setLoading(false);
    }
  };

  // Fetches all orders from the backend API (requires admin authentication)
  const fetchOrders = async () => {
    try {
      // Show loading spinner while fetching orders
      setOrderLoading(true);
      // Get admin token from localStorage for authorization
      const token = localStorage.getItem("adminToken");
      // Make GET request to admin orders endpoint with auth header
      const response = await fetch("http://localhost:5000/api/admin/orders", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // If response is successful, parse and store order data
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401 || response.status === 403) {
        // If token is invalid or expired, force logout
        handleLogout();
      }
    } catch (error) {
      // Log error for debugging
      console.error("Error fetching orders:", error);
      // Show error message to admin
      setMessage({ text: "Error fetching orders.", type: "error" });
    } finally {
      // Hide loading spinner regardless of result
      setOrderLoading(false);
    }
  };

  // Drag & Drop Image Upload Functions
  // Uploads image file to server via API endpoint
  const uploadImage = async (file) => {
    // Validate that the file is actually an image type
    if (!file || !file.type.startsWith('image/')) {
      setMessage({ text: "Please upload an image file", type: "error" });
      return false;
    }

    // Check file size doesn't exceed 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image too large. Max 5MB", type: "error" });
      return false;
    }

    // Show uploading indicator
    setUploadingImage(true);
    // Create FormData object to send file to server
    const formDataImg = new FormData();
    // Append image file to FormData with field name 'image'
    formDataImg.append('image', file);

    try {
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // POST request to image upload endpoint
      const response = await fetch("http://localhost:5000/api/admin/upload-image", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataImg
      });

      // If upload successful, update form with returned image URL
      if (response.ok) {
        const data = await response.json();
        // Update form data with the new image URL
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        // Show success message briefly
        setMessage({ text: "✅ Image uploaded successfully!", type: "success" });
        // Auto-clear success message after 2 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 2000);
        return true;
      } else {
        // Show error if upload failed
        setMessage({ text: "Failed to upload image", type: "error" });
        return false;
      }
    } catch (error) {
      // Log and show upload error
      console.error("Upload error:", error);
      setMessage({ text: "Error uploading image", type: "error" });
      return false;
    } finally {
      // Hide uploading indicator
      setUploadingImage(false);
    }
  };

  // Handle image paste (Ctrl+V) - allows pasting images directly from clipboard
  const handlePaste = async (e) => {
    // Get clipboard data from paste event
    const items = e.clipboardData?.items;
    // If no clipboard data, exit
    if (!items) return;
    
    // Loop through all clipboard items looking for images
    for (let i = 0; i < items.length; i++) {
      // Check if this clipboard item is an image
      if (items[i].type.indexOf('image') !== -1) {
        // Convert clipboard item to file object
        const file = items[i].getAsFile();
        // Upload the pasted image
        await uploadImage(file);
        // Stop after first image found
        break;
      }
    }
  };

  // Handle drag over - visually indicates drop zone is active
  const handleDragOver = (e) => {
    // Prevent default browser behavior (open file)
    e.preventDefault();
    // Set drag active state for visual feedback
    setDragActive(true);
  };

  // Handle drag leave - removes visual drop zone indicator
  const handleDragLeave = (e) => {
    // Prevent default browser behavior
    e.preventDefault();
    // Remove drag active visual state
    setDragActive(false);
  };

  // Handle drop - processes the dropped image file
  const handleDrop = async (e) => {
    // Prevent default browser behavior (open file in new tab)
    e.preventDefault();
    // Remove drag active visual state
    setDragActive(false);
    
    // Get the first dropped file
    const file = e.dataTransfer.files[0];
    // Check if dropped file is an image
    if (file && file.type.startsWith('image/')) {
      // Upload the dropped image
      await uploadImage(file);
    } else {
      // Show error for non-image files
      setMessage({ text: "Please drop an image file", type: "error" });
    }
  };

  // Handle file select from file browser dialog
  const handleFileSelect = async (e) => {
    // Get the first selected file
    const file = e.target.files[0];
    // If a file was selected, upload it
    if (file) {
      await uploadImage(file);
    }
  };

  // Updates an order's status (e.g., pending → shipped → delivered)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // PUT request to update order status
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Send new status in request body
        body: JSON.stringify({ status: newStatus })
      });

      // If update successful, refresh orders list
      if (response.ok) {
        setMessage({ text: "Order status updated!", type: "success" });
        // Refresh orders to show updated status
        fetchOrders();
        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      // Log order update error
      console.error("Error updating order status:", error);
    }
  };

  // Deletes an order from the system (with confirmation)
  const deleteOrder = async (orderId, orderNumber) => {
    // Ask for confirmation before deleting
    if (!window.confirm(`Delete order #${orderNumber}?`)) return;

    try {
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // DELETE request to remove order
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // If deletion successful, update UI
      if (response.ok) {
        setMessage({ text: `Order #${orderNumber} deleted!`, type: "success" });
        // Remove deleted order from local state
        setOrders(orders.filter(order => order.id !== orderId));
        // Close detail modal if viewing the deleted order
        if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      // Log deletion error
      console.error("Error deleting order:", error);
    }
  };

  // Marks an order as delivered (archive function)
  const archiveOrder = async (orderId, orderNumber) => {
    // Ask for confirmation before marking as delivered
    if (!window.confirm(`Mark order #${orderNumber} as delivered?`)) return;

    try {
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // PUT request to update order status to 'delivered'
      await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Set status to delivered
        body: JSON.stringify({ status: 'delivered' })
      });
      // Show success message
      setMessage({ text: `Order #${orderNumber} delivered!`, type: "success" });
      // Refresh orders list
      fetchOrders();
      // Close detail modal if viewing this order
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      // Log archiving error
      console.error("Error archiving order:", error);
    }
  };

  // Handles changes to form input fields (text, number, checkbox)
  const handleInputChange = (e) => {
    // Destructure name, value, and type from event target
    const { name, value, type } = e.target;
    // Update form data, handling checkbox differently from other inputs
    setFormData({
      ...formData,
      // For checkboxes use 'checked' property, for others use 'value'
      [name]: type === "checkbox" ? e.target.checked : value
    });
  };

  // Handles form submission for adding/editing products
  const handleSubmit = async (e) => {
    // Prevent default form submission (page reload)
    e.preventDefault();
    // Clear any existing messages
    setMessage({ text: "", type: "" });

    try {
      // Validate required fields are filled
      if (!formData.name || !formData.price || !formData.quantity) {
        setMessage({ text: "Fill all required fields", type: "error" });
        return;
      }

      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // Determine URL: edit uses PUT to specific product, add uses POST to products collection
      const url = editingProduct 
        ? `http://localhost:5000/api/admin/products/${editingProduct.id}`
        : "http://localhost:5000/api/admin/products";
      // Determine HTTP method: PUT for editing, POST for adding
      const method = editingProduct ? "PUT" : "POST";

      // Make API request to add or update product
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // Send form data as JSON
        body: JSON.stringify(formData),
      });

      // If successful, refresh products list and show message
      if (response.ok) {
        setMessage({ text: editingProduct ? "Product updated!" : "Product added!", type: "success" });
        // Refresh the products list
        await fetchProducts();
        // Reset form to empty state
        resetForm();
        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      // Log and show save error
      console.error("Error saving product:", error);
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    }
  };

  // Loads a product's data into the form for editing
  const handleEdit = (product) => {
    // Set editing product reference
    setEditingProduct(product);
    // Populate form with product's current values
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image || "",
      quantity: product.quantity,
      // Convert sale to boolean (handles both 0/1 and true/false)
      sale: product.sale === 1 || product.sale === true
    });
    // Smooth scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Deletes a product with confirmation prompt
  const handleDelete = async (id) => {
    // Ask admin to confirm deletion
    if (window.confirm("Delete this product?")) {
      try {
        // Get admin token for authorization
        const token = localStorage.getItem("adminToken");
        // DELETE request to remove product
        const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
          method: "DELETE",
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // If deletion successful, refresh list and show message
        if (response.ok) {
          setMessage({ text: "Product deleted!", type: "success" });
          // Refresh products list
          fetchProducts();
          // Auto-clear message after 3 seconds
          setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        }
      } catch (error) {
        // Log deletion error
        console.error("Error deleting product:", error);
      }
    }
  };

  // Resets the product form to empty/default state
  const resetForm = () => {
    // Clear all form fields
    setFormData({ name: "", price: "", image: "", quantity: "", sale: false });
    // Clear editing state
    setEditingProduct(null);
  };

  // Logs out admin user by clearing localStorage and redirecting
  const handleLogout = () => {
    // Remove admin authentication token
    localStorage.removeItem("adminToken");
    // Remove admin info
    localStorage.removeItem("adminInfo");
    // Redirect to admin login page
    navigate("/admin/login");
  };

  // Fetches AI demand forecast data from backend
  const fetchForecast = async () => {
    try {
      // Show loading state
      setForecastLoading(true);
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // GET request to AI forecast endpoint
      const response = await fetch("http://localhost:5000/api/ai/forecast", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Parse forecast data
      const data = await response.json();
      // Store forecast data in state
      setForecastData(data);
      // Show forecast modal
      setShowForecastModal(true);
    } catch (error) {
      // Show error alert if forecast fails
      alert("Failed to fetch forecast");
    } finally {
      // Hide loading state
      setForecastLoading(false);
    }
  };

  // Generates AI product description based on name and price
  const generateDescription = async () => {
    // Validate product name is entered
    if (!formData.name) {
      alert("Enter product name first");
      return;
    }
    try {
      // Get admin token for authorization
      const token = localStorage.getItem("adminToken");
      // POST request to generate description endpoint
      const response = await fetch("http://localhost:5000/api/ai/generate-description", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        // Send product name and price for description generation
        body: JSON.stringify({ productName: formData.name, price: formData.price })
      });
      // Parse AI-generated description
      const data = await response.json();
      // Show description in alert dialog
      alert("🤖 AI Generated Description:\n\n" + data.description);
    } catch (error) {
      // Show error if generation fails
      alert("Error generating description");
    }
  };

  // Parses order items from string or returns empty array if null/invalid
  const parseOrderItems = (items) => {
    // Return empty array if no items
    if (!items) return [];
    try {
      // Parse JSON string if items is string, otherwise return as-is
      return typeof items === 'string' ? JSON.parse(items) : items;
    } catch {
      // Return empty array on parse error
      return [];
    }
  };

  // Returns appropriate icon component based on order status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <FaCheckCircle className="text-green-400" />; // Green checkmark for delivered orders
      case 'processing': return <FaSpinner className="text-blue-400 animate-spin" />; // Spinning icon for processing
      case 'shipped': return <FaTruck className="text-purple-400" />; // Truck icon for shipped orders
      case 'cancelled': return <FaTimesCircle className="text-red-400" />; // X icon for cancelled orders
      default: return <FaClock className="text-yellow-400" />; // Clock icon for pending orders
    }
  };

  // Returns CSS class string for status badge colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30'; // Green styling for delivered
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'; // Blue styling for processing
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'; // Purple styling for shipped
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'; // Red styling for cancelled
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // Yellow styling for pending
    }
  };

  // Calculate total revenue from all orders (sum of total_amount)
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  // Count total number of orders
  const totalOrders = orders.length;
  // Count total number of products in inventory
  const totalProducts = products.length;
  // Count products with low stock (0-10 units remaining)
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;

  // Show loading spinner while initial products are being fetched
  if (loading && products.length === 0 && activeTab === "products") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          {/* Animated spinning circle loader */}
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {/* Loading message */}
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background - decorative floating shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Purple floating orb - top right */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        {/* Blue floating orb - bottom left, delayed animation */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Header - sticky top bar with glass morphism effect */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Left side - Logo and title */}
            <div className="flex items-center gap-3">
              {/* Crown icon in gradient circle */}
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <FaCrown className="text-white text-2xl" />
              </div>
              <div>
                {/* Gradient text title */}
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Admin Dashboard</h1>
                {/* Subtitle */}
                <p className="text-purple-300 text-sm">Manage your store with AI power</p>
              </div>
            </div>
            {/* Right side - Welcome message and logout button */}
            <div className="flex items-center gap-4">
              {/* Welcome badge with admin username */}
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 border border-white/20">
                <span className="text-purple-300 text-sm">Welcome, </span>
                {/* Display admin username or fallback to "Admin" */}
                <span className="text-white font-semibold">{adminInfo?.username || "Admin"}</span>
              </div>
              {/* Logout button */}
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-all duration-300 border border-red-500/30 hover:border-red-500/50">
                <FaSignOutAlt size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-8">
        {/* Stats Cards - 4 key metrics displayed at top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Revenue */}
          <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                {/* Label */}
                <p className="text-blue-300 text-sm font-medium">Total Revenue</p>
                {/* Revenue amount formatted to 2 decimal places */}
                <p className="text-white text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              {/* Money icon */}
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaMoneyBillWave className="text-blue-400 text-2xl" />
              </div>
            </div>
          </div>
          {/* Card 2: Total Orders */}
          <div className="group bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                {/* Label */}
                <p className="text-green-300 text-sm font-medium">Total Orders</p>
                {/* Order count */}
                <p className="text-white text-3xl font-bold">{totalOrders}</p>
              </div>
              {/* Shopping bag icon */}
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaShoppingBag className="text-green-400 text-2xl" />
              </div>
            </div>
          </div>
          {/* Card 3: Total Products */}
          <div className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                {/* Label */}
                <p className="text-purple-300 text-sm font-medium">Total Products</p>
                {/* Product count */}
                <p className="text-white text-3xl font-bold">{totalProducts}</p>
              </div>
              {/* Box icon */}
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaBox className="text-purple-400 text-2xl" />
              </div>
            </div>
          </div>
          {/* Card 4: Low Stock Items */}
          <div className="group bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                {/* Label */}
                <p className="text-orange-300 text-sm font-medium">Low Stock Items</p>
                {/* Low stock count */}
                <p className="text-white text-3xl font-bold">{lowStockProducts}</p>
              </div>
              {/* Tag icon */}
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaTags className="text-orange-400 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs - Switch between Products and Orders views */}
        <div className="flex gap-3 mb-8 border-b border-white/20 pb-4">
          {/* Products tab button */}
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "products" 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25" // Active tab styling
                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white" // Inactive tab styling
            }`}
          >
            <FaBox /> Products ({products.length})
          </button>
          {/* Orders tab button */}
          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "orders" 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25" // Active tab styling
                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white" // Inactive tab styling
            }`}
          >
            <FaShoppingBag /> Orders ({orders.length})
          </button>
        </div>

        {/* AI Analytics Section - only shows when Products tab is active */}
        {activeTab === "products" && (
          <div className="mb-8">
            {/* Sub-tabs for analytics: Dashboard vs Charts */}
            <div className="flex gap-3 mb-6">
              {/* AI Analytics Dashboard button */}
              <button
                onClick={() => setActiveSection("analytics")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "analytics" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" // Active section
                    : "bg-white/10 text-gray-300 hover:bg-white/20" // Inactive section
                }`}
              >
                <FaChartLine /> AI Analytics Dashboard
              </button>
              {/* Charts & Graphs button */}
              <button
                onClick={() => setActiveSection("charts")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "charts" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md" // Active section
                    : "bg-white/10 text-gray-300 hover:bg-white/20" // Inactive section
                }`}
              >
                <FaChartBar /> Charts & Graphs
              </button>
            </div>
            {/* Analytics content container */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              {/* Render either Analytics Dashboard or Charts based on active section */}
              {activeSection === "analytics" ? <AISalesDashboard /> : <AICharts />}
            </div>
          </div>
        )}

        {/* Message Toast - appears at top right for success/error notifications */}
        {message.text && (
          <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl animate-slide-in-right backdrop-blur-md border ${
            message.type === "success" 
              ? "bg-green-500/90 border-green-400 text-white" // Green for success
              : "bg-red-500/90 border-red-400 text-white" // Red for error
          }`}>
            {/* Display the message text */}
            {message.text}
          </div>
        )}

        {/* AI Forecast Modal - displays demand predictions */}
        {showForecastModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowForecastModal(false)}>
            {/* Modal content - stops click from closing modal when clicking inside */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal header with gradient background */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-t-2xl flex justify-between items-center">
                {/* Title with robot icon */}
                <h2 className="text-white text-xl font-bold flex items-center gap-2"><FaRobot className="animate-pulse" /> AI Demand Forecast</h2>
                {/* Close button */}
                <button onClick={() => setShowForecastModal(false)} className="text-white hover:text-gray-200 text-3xl leading-none">&times;</button>
              </div>
              {/* Forecast data list */}
              <div className="p-6 space-y-4">
                {/* Map through each forecast item */}
                {forecastData.map((item, index) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 transition-all hover:transform hover:-translate-y-0.5 ${
                    item.trend === '📈 High Demand' ? 'border-green-500 bg-green-500/10' : // Green for high demand
                    item.trend === '📊 Steady' ? 'border-yellow-500 bg-yellow-500/10' : // Yellow for steady
                    'border-red-500 bg-red-500/10' // Red for low demand
                  }`}>
                    <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                      <div>
                        {/* Product name */}
                        <h3 className="text-white font-bold text-lg">{item.name}</h3>
                        {/* Units sold */}
                        <p className="text-gray-400 text-sm">Sold: {item.total_sold} units</p>
                      </div>
                      <div className="text-right">
                        {/* Trend indicator */}
                        <span className="text-white text-xl">{item.trend}</span>
                        {/* Forecast confidence score */}
                        <p className="text-green-400 text-sm font-semibold">Score: {item.forecast_score}/100</p>
                      </div>
                    </div>
                    {/* AI recommendation box */}
                    <div className="mt-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <p className="text-purple-300 text-sm"><FaRobot className="inline mr-2" /> <span className="font-semibold">AI Recommendation:</span> {item.trend === '📈 High Demand' ? `Order ${item.recommended_stock} units immediately!` : item.trend === '📊 Steady' ? `Keep ${item.recommended_stock} units in stock` : `Consider running a promotion or discount`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal - shows full order information when an order is selected */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedOrder(null)}>
            {/* Modal content - stops propagation to prevent closing when clicking inside */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-purple-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-t-2xl flex justify-between items-center">
                {/* Order number title */}
                <h2 className="text-white text-xl font-bold">Order #{selectedOrder.order_number}</h2>
                {/* Close button */}
                <button onClick={() => setSelectedOrder(null)} className="text-white hover:text-gray-200 text-3xl leading-none">&times;</button>
              </div>
              <div className="p-6 space-y-5">
                {/* Customer Information section */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2"><FaUsers /> Customer Information</h3>
                  <div className="space-y-1 text-white">
                    {/* Customer full name */}
                    <p><span className="text-gray-400 w-24 inline-block">Name:</span> {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                    {/* Customer email */}
                    <p><span className="text-gray-400 w-24 inline-block">Email:</span> {selectedOrder.customer_email}</p>
                    {/* Customer phone */}
                    <p><span className="text-gray-400 w-24 inline-block">Phone:</span> {selectedOrder.customer_phone}</p>
                  </div>
                </div>
                {/* Shipping Address section */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3">📦 Shipping Address</h3>
                  {/* Full shipping address */}
                  <p className="text-white">{selectedOrder.shipping_address}<br/>{selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                </div>
                {/* Order Items section */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3">🛒 Order Items</h3>
                  <div className="space-y-2">
                    {/* List each item in the order */}
                    {parseOrderItems(selectedOrder.items).map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-white/10">
                        {/* Item name and quantity */}
                        <span className="text-white">{item.product_name} x {item.quantity}</span>
                        {/* Item subtotal */}
                        <span className="text-green-400 font-semibold">${item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Order Summary section */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-5 border border-purple-500/30">
                  <h3 className="text-purple-400 font-semibold mb-3">💰 Order Summary</h3>
                  <div className="space-y-2">
                    {/* Subtotal before shipping */}
                    <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span><span className="text-white">${selectedOrder.subtotal}</span></div>
                    {/* Shipping cost */}
                    <div className="flex justify-between"><span className="text-gray-400">Shipping:</span><span className="text-white">${selectedOrder.shipping_cost}</span></div>
                    {/* Total with shipping */}
                    <div className="flex justify-between pt-2 border-t border-white/20 mt-2"><span className="text-white font-bold">Total:</span><span className="text-green-400 font-bold text-xl">${selectedOrder.total_amount}</span></div>
                  </div>
                </div>
                {/* Order Status section */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">{getStatusIcon(selectedOrder.order_status)} Order Status</h3>
                  {/* Status dropdown selector */}
                  <select value={selectedOrder.order_status} onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)} className={`w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 ${getStatusColor(selectedOrder.order_status)} border`}>
                    <option value="pending" className="bg-gray-800">⏳ Pending</option>
                    <option value="processing" className="bg-gray-800">⚙️ Processing</option>
                    <option value="shipped" className="bg-gray-800">🚚 Shipped</option>
                    <option value="delivered" className="bg-gray-800">✅ Delivered</option>
                    <option value="cancelled" className="bg-gray-800">❌ Cancelled</option>
                  </select>
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {/* Mark as Delivered button */}
                    <button onClick={() => archiveOrder(selectedOrder.id, selectedOrder.order_number)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2">✓ Mark Delivered</button>
                    {/* Delete Order button */}
                    <button onClick={() => deleteOrder(selectedOrder.id, selectedOrder.order_number)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2">🗑️ Delete Order</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab Content - shown when Products tab is active */}
        {activeTab === "products" ? (
          <>
            {/* Add/Edit Product Form - glass morphism card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8 hover:border-purple-500/30 transition-all">
              {/* Form title changes based on whether editing or adding */}
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingProduct ? <FaEdit className="text-yellow-400" /> : <FaPlus className="text-green-400" />}
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Product fields grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Product Name field */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="Enter product name" />
                  </div>
                  {/* Price field */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Price ($) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="0.00" />
                  </div>
                  {/* Quantity field */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Quantity *</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" required className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="0" />
                  </div>
                  {/* Sale checkbox */}
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
                  
                  {/* Drag & Drop Area - accepts drag, drop, paste, and click to upload */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
                      ${dragActive 
                        ? "border-purple-500 bg-purple-500/20" // Active drag state
                        : "border-white/30 bg-white/5 hover:border-purple-500/50 hover:bg-white/10" // Normal state
                      }
                      ${uploadingImage ? "opacity-50 pointer-events-none" : ""} // Disabled while uploading
                    `}
                    onClick={() => fileInputRef.current?.click()} // Click to open file browser
                  >
                    {/* Hidden file input triggered programmatically */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*" // Only accept image files
                      className="hidden"
                    />
                    
                    {/* Uploading state - shows spinner */}
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <FaSpinner className="text-purple-400 text-3xl animate-spin" />
                        <p className="text-white text-sm">Uploading image...</p>
                      </div>
                    ) : formData.image ? (
                      // Image preview state - shows uploaded image with remove/change options
                      <div className="flex flex-col items-center gap-3">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500"
                        />
                        <div className="flex gap-2">
                          {/* Remove image button */}
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
                          {/* Change image button */}
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
                      // Empty state - instructions for uploading
                      <div className="flex flex-col items-center gap-2">
                        <FaCloudUploadAlt className="text-purple-400 text-4xl" />
                        <p className="text-white font-medium">Drag & Drop image here</p>
                        <p className="text-gray-400 text-sm">or click to browse</p>
                        <p className="text-gray-500 text-xs">Supports: JPG, PNG, GIF, WEBP (Max 5MB)</p>
                        <p className="text-gray-500 text-xs">💡 Tip: You can also Ctrl+V to paste image</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Manual URL input - alternative to drag & drop */}
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

                {/* Form action buttons */}
                <div className="flex gap-3 flex-wrap">
                  {/* Submit button - text changes based on editing state */}
                  <button type="submit" disabled={uploadingImage} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </button>
                  {/* AI Description generator button */}
                  <button type="button" onClick={generateDescription} className="px-6 py-2.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2">
                    <FaRobot /> AI Description
                  </button>
                  {/* Cancel button - only shown when editing */}
                  {editingProduct && <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-gray-600/50 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">Cancel</button>}
                </div>
              </form>
            </div>

            {/* Products Table - displays all products in a sortable table */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                {/* Table title with product count */}
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaBox /> Product List ({products.length})</h2>
                {/* AI Demand Forecast button */}
                <button onClick={fetchForecast} disabled={forecastLoading} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md">
                  <FaRobot className={forecastLoading ? "animate-pulse" : ""} /> {forecastLoading ? "Analyzing..." : "AI Demand Forecast"}
                </button>
              </div>
              {/* Empty state when no products exist */}
              {products.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No products found. Add your first product above!</p>
              ) : (
                // Products table
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {/* Table header */}
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
                    {/* Table body - maps through each product */}
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
                          {/* Product ID */}
                          <td className="py-3 px-4 text-white">#{product.id}</td>
                          {/* Product name with image thumbnail */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {/* Show image if available */}
                              {product.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white/10" />}
                              <span className="text-white font-medium group-hover:text-purple-400 transition-colors">{product.name}</span>
                            </div>
                          </td>
                          {/* Product price (green text for emphasis) */}
                          <td className="py-3 px-4 text-green-400 font-semibold">${parseFloat(product.price).toFixed(2)}</td>
                          {/* Stock level with color-coded badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              product.quantity > 10 ? "bg-green-500/20 text-green-400" : // High stock
                              product.quantity > 0 ? "bg-yellow-500/20 text-yellow-400" : // Low stock
                              "bg-red-500/20 text-red-400" // Out of stock
                            }`}>
                              {product.quantity}
                            </span>
                          </td>
                          {/* Sale badge - animated pulse effect */}
                          <td className="py-3 px-4">{product.sale ? <span className="inline-block px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold animate-pulse">SALE</span> : "-"}</td>
                          {/* Action buttons: Edit and Delete */}
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {/* Edit button */}
                              <button onClick={() => handleEdit(product)} className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"><FaEdit size={14} /></button>
                              {/* Delete button */}
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
          // Orders Tab Content - shown when Orders tab is active
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              {/* Orders title with count */}
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaShoppingBag /> Orders ({orders.length})</h2>
              {/* Refresh orders button */}
              <button onClick={fetchOrders} disabled={orderLoading} className="px-5 py-2.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2">
                {orderLoading ? <FaSpinner className="animate-spin" /> : "🔄"} {orderLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {/* Loading spinner while fetching orders */}
            {orderLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              // Empty state for no orders
              <p className="text-gray-400 text-center py-12">No orders found.</p>
            ) : (
              // Orders table
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table header */}
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
                  {/* Table body - maps through each order */}
                  <tbody>
                    {orders.map((order) => {
                      // Parse order items for display
                      const items = parseOrderItems(order.items);
                      return (
                        <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          {/* Order number */}
                          <td className="py-3 px-4 text-white font-semibold">#{order.order_number}</td>
                          {/* Customer info - name and email */}
                          <td className="py-3 px-4">
                            <div className="text-white">{order.customer_first_name} {order.customer_last_name}</div>
                            <div className="text-gray-400 text-xs">{order.customer_email}</div>
                          </td>
                          {/* Order date formatted to locale string */}
                          <td className="py-3 px-4 text-gray-300">{new Date(order.created_at).toLocaleDateString()}</td>
                          {/* Number of items in order */}
                          <td className="py-3 px-4 text-white">{items.length} {items.length === 1 ? 'item' : 'items'}</td>
                          {/* Order total */}
                          <td className="py-3 px-4 text-green-400 font-bold">${parseFloat(order.total_amount).toFixed(2)}</td>
                          {/* Status with icon and dropdown selector */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {/* Status icon based on current status */}
                              {getStatusIcon(order.order_status)}
                              {/* Status dropdown for quick status changes */}
                              <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 ${getStatusColor(order.order_status)} border`}>
                                <option value="pending" className="bg-gray-800">Pending</option>
                                <option value="processing" className="bg-gray-800">Processing</option>
                                <option value="shipped" className="bg-gray-800">Shipped</option>
                                <option value="delivered" className="bg-gray-800">Delivered</option>
                                <option value="cancelled" className="bg-gray-800">Cancelled</option>
                              </select>
                            </div>
                          </td>
                          {/* View order details button */}
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

      {/* Add custom CSS animations - slide-in from right and fade-in */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%); /* Start off-screen to the right */
            opacity: 0; /* Start invisible */
          }
          to {
            transform: translateX(0); /* End at normal position */
            opacity: 1; /* Fully visible */
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0; /* Start invisible */
          }
          to {
            opacity: 1; /* Fully visible */
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out; /* Apply slide-in animation */
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out; /* Apply fade-in animation */
        }
        .delay-1000 {
          animation-delay: 1s; /* Delay animation by 1 second */
        }
      `}</style>
    </div>
  );
};

export default AdminPage; // Export component for use in router