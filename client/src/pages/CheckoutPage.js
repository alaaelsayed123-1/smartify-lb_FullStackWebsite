// src/pages/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { FaTruck, FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaShieldAlt, FaArrowLeft, FaCheckCircle, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhone, FaUser, FaBoxOpen } from "react-icons/fa";

const CheckoutPage = ({ cart, clearCart }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: ''
  });
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    address: '',
    city: '',
    country: 'Lebanon',
    phone: user?.phone || '',
    postalCode: '',
    shippingMethod: 'express',
    paymentMethod: 'cod',
    newsletter: false,
    sameBillingAddress: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      alert("Please login to continue with checkout");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  };

  const calculateShipping = () => {
    return formData.shippingMethod === 'express' ? 3.00 : 0.00;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  const handleSubmitStep1 = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      navigate('/products');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const validatePayment = () => {
    if (formData.paymentMethod === 'cod') {
      return true;
    }
    
    if (formData.paymentMethod === 'whish') {
      if (!paymentDetails.phoneNumber || paymentDetails.phoneNumber.length < 8) {
        alert("Please enter a valid phone number for Whish Pay");
        return false;
      }
      return true;
    }
    
    if (formData.paymentMethod === 'wpay') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 12) {
        alert("Please enter a valid card number");
        return false;
      }
      if (!paymentDetails.cardName) {
        alert("Please enter the cardholder name");
        return false;
      }
      if (!paymentDetails.expiryDate) {
        alert("Please enter expiry date (MM/YY)");
        return false;
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
        alert("Please enter a valid CVV");
        return false;
      }
      return true;
    }
    
    return true;
  };

  const processPayment = async () => {
    if (!validatePayment()) {
      return false;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    return true;
  };

  const completeOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!isAuthenticated) {
      alert("Please login to place order");
      navigate("/login");
      return;
    }

    if (!token) {
      alert("Authentication error. Please login again.");
      navigate("/login");
      return;
    }

    if (formData.paymentMethod !== 'cod') {
      setShowPaymentModal(true);
      return;
    }

    await placeOrder();
  };

  const placeOrder = async () => {
    setLoading(true);

    const orderData = {
      customer_email: formData.email,
      customer_first_name: formData.firstName,
      customer_last_name: formData.lastName,
      customer_phone: formData.phone,
      shipping_address: formData.address,
      shipping_city: formData.city,
      shipping_country: formData.country,
      shipping_postal_code: formData.postalCode,
      shipping_method: formData.shippingMethod,
      payment_method: formData.paymentMethod,
      billing_same_as_shipping: formData.sameBillingAddress,
      billing_address: formData.sameBillingAddress ? formData.address : '',
      newsletter_subscription: formData.newsletter,
      notes: formData.paymentMethod !== 'cod' ? `Payment Details: ${JSON.stringify(paymentDetails)}` : ''
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        setOrderNumber(result.order_number);
        setOrderComplete(true);
        if (clearCart) {
          clearCart();
        }
        window.dispatchEvent(new Event('orderPlaced'));
        setShowPaymentModal(false);
        
        console.log('✅ Order placed! WhatsApp confirmation sent by backend.');
        
      } else if (response.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        alert(`Error: ${result.message || "Failed to place order"}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    const paymentSuccess = await processPayment();
    if (paymentSuccess) {
      await placeOrder();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBoxOpen className="text-purple-400 text-5xl" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Add some products to your cart before checking out.</p>
          <button 
            onClick={() => navigate('/products')} 
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full text-center border border-white/20 animate-fade-in-up">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <FaCheckCircle className="text-white text-5xl" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">🎉 Order Placed Successfully!</h2>
          <div className="bg-white/5 rounded-xl p-6 my-6 text-left">
            <p className="text-gray-300 mb-2"><strong className="text-white">Order Number:</strong> <span className="text-purple-400">{orderNumber}</span></p>
            <p className="text-gray-300 mb-2"><strong className="text-white">Thank you for your purchase, {formData.firstName}!</strong></p>
            <p className="text-gray-300 mb-2"><strong className="text-white">Payment Method:</strong> {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : formData.paymentMethod === 'whish' ? 'Whish Pay' : 'WPAY'}</p>
            <p className="text-gray-300 mb-2"><strong className="text-white">Confirmation sent to:</strong> {formData.email}</p>
            <p className="text-gray-300 mb-2"><strong className="text-white">Delivery time:</strong> 2-3 working days</p>
            <p className="text-green-400 mt-4 flex items-center gap-2">
              <FaWhatsapp className="text-xl" />
              WhatsApp confirmation sent to {formData.phone || "your number"}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/products')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
              Continue Shopping
            </button>
            <button onClick={() => navigate('/home')} className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {formData.paymentMethod === 'whish' ? <FaMobileAlt className="text-purple-600" /> : <FaCreditCard className="text-purple-600" />}
                {formData.paymentMethod === 'whish' ? 'Whish Pay' : 'WPAY Payment'}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <p className="text-gray-600 mb-6 text-sm">
              {formData.paymentMethod === 'whish' 
                ? 'Enter your Whish Pay phone number to complete payment' 
                : 'Enter your card details to complete payment'}
            </p>
            
            {formData.paymentMethod === 'whish' && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={paymentDetails.phoneNumber}
                  onChange={handlePaymentInputChange}
                  placeholder="03 123 456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">You'll receive a confirmation SMS to complete the payment</p>
              </div>
            )}
            
            {formData.paymentMethod === 'wpay' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Card Number *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentDetails.cardNumber}
                    onChange={handlePaymentInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Cardholder Name *</label>
                  <input
                    type="text"
                    name="cardName"
                    value={paymentDetails.cardName}
                    onChange={handlePaymentInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 font-medium mb-2">Expiry Date *</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentDetails.expiryDate}
                      onChange={handlePaymentInputChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 font-medium mb-2">CVV *</label>
                    <input
                      type="password"
                      name="cvv"
                      value={paymentDetails.cvv}
                      onChange={handlePaymentInputChange}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Order Total:</span>
                <span className="font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={handlePaymentSubmit}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing Payment...' : `Pay $${calculateTotal().toFixed(2)}`}
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-4">🔒 Demo Mode - No real payment will be charged</p>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>1</div>
              <span className="hidden sm:inline">Information</span>
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>2</div>
              <span className="hidden sm:inline">Review</span>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Checkout ({cart.length} items)</h1>
            
            <div className="bg-white/5 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Order Preview</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between py-3 border-b border-white/10 text-gray-300">
                  <span>{item.name} x {item.quantity || 1}</span>
                  <span className="text-white">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 font-bold text-white">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmitStep1}>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><FaEnvelope /> Contact Information</h2>
                <div className="mb-4">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="your@email.com"
                  />
                </div>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input type="checkbox" name="newsletter" checked={formData.newsletter} onChange={handleInputChange} />
                  <span>Email me with news and offers</span>
                </label>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><FaMapMarkerAlt /> Shipping Address</h2>
                
                <div className="mb-4">
                  <select name="country" value={formData.country} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                    <option value="Lebanon">Lebanon</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First name" className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Last name" className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                </div>

                <div className="mb-4">
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Address" className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="Postal code" className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                </div>

                <div className="mb-4">
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Phone number" className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400" />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><FaWhatsapp /> WhatsApp order confirmation will be sent to this number</p>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                Continue to Review Order
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Review Your Order</h1>
              <button onClick={handleBack} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"><FaArrowLeft /> Edit Information</button>
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><FaEnvelope /> Contact</h3>
                <p className="text-gray-300">{formData.email}</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><FaMapMarkerAlt /> Shipping Address</h3>
                <p className="text-gray-300">{formData.firstName} {formData.lastName}</p>
                <p className="text-gray-300">{formData.address}</p>
                <p className="text-gray-300">{formData.city}, {formData.country} {formData.postalCode}</p>
                <p className="text-gray-300 flex items-center gap-1"><FaPhone className="text-sm" /> {formData.phone}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Order Items ({cart.length})</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between py-3 border-b border-white/10">
                  <div>
                    <div className="text-white">{item.name}</div>
                    <div className="text-sm text-gray-400">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="text-white font-semibold">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><FaTruck /> Shipping Method</h3>
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex justify-between">
                <span className="text-white">Express Delivery (2-3 Working Days)</span>
                <span className="text-green-400 font-bold">${calculateShipping().toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><FaCreditCard /> Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "cod" ? "bg-purple-600/30 border-2 border-purple-500" : "bg-white/5 border border-white/20"}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === "cod"} onChange={handleInputChange} />
                  <div><div className="font-semibold text-white flex items-center gap-2"><FaMoneyBillWave /> Cash on Delivery</div><div className="text-xs text-gray-400">Pay when you receive</div></div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "whish" ? "bg-purple-600/30 border-2 border-purple-500" : "bg-white/5 border border-white/20"}`}>
                  <input type="radio" name="paymentMethod" value="whish" checked={formData.paymentMethod === "whish"} onChange={handleInputChange} />
                  <div><div className="font-semibold text-white flex items-center gap-2"><FaMobileAlt /> Whish Pay</div><div className="text-xs text-gray-400">Pay with mobile wallet</div></div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "wpay" ? "bg-purple-600/30 border-2 border-purple-500" : "bg-white/5 border border-white/20"}`}>
                  <input type="radio" name="paymentMethod" value="wpay" checked={formData.paymentMethod === "wpay"} onChange={handleInputChange} />
                  <div><div className="font-semibold text-white flex items-center gap-2"><FaCreditCard /> WPAY</div><div className="text-xs text-gray-400">Pay with card</div></div>
                </label>
              </div>
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg text-center text-sm text-blue-300">🔒 Demo Mode - No real payment will be charged</div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="flex justify-between py-2 text-gray-300"><span>Subtotal</span><span>${calculateSubtotal().toFixed(2)}</span></div>
              <div className="flex justify-between py-2 text-gray-300"><span>Shipping</span><span>${calculateShipping().toFixed(2)}</span></div>
              <div className="flex justify-between pt-4 mt-2 border-t border-white/20 text-xl font-bold text-white"><span>Total</span><span className="text-green-400">${calculateTotal().toFixed(2)}</span></div>
            </div>

            <button onClick={completeOrder} disabled={loading} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50">
              {loading ? 'Processing...' : 'Place Order'}
            </button>
            
            <p className="text-center mt-4 text-gray-400 text-sm flex items-center justify-center gap-2"><FaWhatsapp /> WhatsApp confirmation will be sent to {formData.phone || "your phone number"}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default CheckoutPage;