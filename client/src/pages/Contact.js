// ============================================================
// CONTACT PAGE - SMARTIFY LB (ULTRA PREMIUM PROFESSIONAL DESIGN)
// ============================================================
// Enterprise-grade contact page with cutting-edge UI/UX
// Features: 3D transforms, parallax, typing animation, micro-interactions
// ============================================================
// This is the main React component file containing all logic and structure
// Styles are imported from styles/Contact.css
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, 
  FaPaperPlane, FaCheckCircle, FaWhatsapp, FaHeadset, 
  FaArrowLeft, FaUser, FaTag, FaCommentDots, FaStar,
  FaShieldAlt, FaRocket, FaLinkedin, FaInstagram,
  FaFacebook, FaTwitter, FaChevronRight, FaQuoteLeft,
  FaAward, FaGlobe, FaChartLine
} from "react-icons/fa";
import "../styles/Contact.css";

const Contact = () => {
  // Q: How do we get the logged-in user's information?
  // A: We destructure 'user' and 'isAuthenticated' from the useAuth() custom hook.
  const { user, isAuthenticated } = useAuth();
  
  // Q: How do we make the page fade in smoothly when it first loads?
  // A: We use a boolean state 'isVisible'. It starts false (hidden) and becomes true (visible) in a useEffect.
  const [isVisible, setIsVisible] = useState(false);
  
  // Q: How does the purple glow follow the user's cursor?
  // A: We track the mouse's x and y coordinates in state and update them on every 'mousemove' event.
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Q: How do we know which FAQ answer is currently open?
  // A: 'activeFAQ' stores the index of the open FAQ item, or null if all are closed.
  const [activeFAQ, setActiveFAQ] = useState(null);
  
  // Q: Why do we need a ref attached to the form?
  // A: 'formRef' provides a direct reference to the form's DOM node, useful for scrolling to it or other direct manipulations.
  const formRef = useRef(null);

  // Q: Where is the mouse tracking logic set up and why does it run only once?
  // A: Inside a useEffect with an empty dependency array []. It adds a 'mousemove' listener on mount and removes it on unmount.
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Q: What specific mouse properties are we tracking?
      // A: e.clientX (horizontal position) and e.clientY (vertical position).
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Q: What triggers the initial page fade-in animation?
    // A: Calling setIsVisible(true) here, right after the component mounts.
    setIsVisible(true);
    // Q: What is the purpose of the function returned by this useEffect?
    // A: It's a cleanup function. It removes the event listener when the component unmounts to prevent memory leaks.
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Q: How does the form pre-fill data for logged-in users?
  // A: The initial formData state checks 'isAuthenticated'. If true, it uses optional chaining (?.) to safely get user.first_name, etc., from the user object.
  const [formData, setFormData] = useState({
    name: isAuthenticated ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() : "",
    email: isAuthenticated ? user?.email || "" : "",
    phone: isAuthenticated ? user?.phone || "" : "",
    subject: "",
    message: "",
    category: "general"
  });

  // Q: What are the different states related to submitting the form?
  // A: 'isSubmitting' (boolean for loading), 'submitStatus' (null or {type, message} for success/error), 'errors' (object holding field-level error strings).
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  // Q: How do we track which form field is currently focused?
  // A: 'focusedField' state stores the 'name' of the focused input (like 'email') or null. This drives the dynamic focus border styles.
  const [focusedField, setFocusedField] = useState(null);
  // Q: How does the multi-step form logic work?
  // A: 'currentStep' state holds a number (1, 2, or 3). We conditionally render content based on its value.
  const [currentStep, setCurrentStep] = useState(1);

  // Q: What happens when a user types in an input field?
  // A: The handleChange function is called. It extracts the 'name' and 'value' from the event target and updates that specific field in formData.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Q: Why do we clear the error for a field when its value changes?
    // A: To provide a better user experience. The error disappears immediately as the user starts correcting it.
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Q: What are the exact validation rules for the form?
  // A: Name & email cannot be empty. Email must match a basic regex. Subject and message cannot be empty. The message must be at least 10 characters.
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Please enter your full name";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.subject.trim()) newErrors.subject = "Subject cannot be empty";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters";
    setErrors(newErrors);
    // Q: How do we know if the entire form is valid?
    // A: The function returns true only if the 'newErrors' object has no keys (i.e., is empty).
    return Object.keys(newErrors).length === 0;
  };

  // Q: What steps are involved in submitting the form to the backend?
  // A: Prevent default form submission, validate the form, set isSubmitting to true, send a POST request with fetch, and handle the response (success or error).
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Stop the process if validation fails
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Q: Where is the authentication token stored for the API request?
      // A: It's retrieved from the browser's localStorage.
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Q: How do we conditionally add the Authorization header?
          // A: Using the spread operator (...) with a short-circuit. If 'token' is truthy, the object is spread and the header is added. If not, nothing is added.
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          // Q: How do we link the message to a user account?
          // A: We include the user's ID from the auth context, but only if they are authenticated.
          userId: isAuthenticated ? user?.id : null
        })
      });
      
      const data = await response.json();
      
      // Q: What happens after a successful submission?
      // A: A success status is set, the form data is completely reset to its initial state, and the multi-step form is sent back to step 1.
      if (response.ok && data.success) {
        setSubmitStatus({ type: "success", message: "Your message has been sent successfully! We'll respond within 24 hours." });
        setFormData({
          name: isAuthenticated ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() : "",
          email: isAuthenticated ? user?.email || "" : "",
          phone: isAuthenticated ? user?.phone || "" : "",
          subject: "",
          message: "",
          category: "general"
        });
        setCurrentStep(1);
      } else {
        // Q: How are server-side validation or business logic errors shown?
        // A: The error message from the backend (data.message) is stored in the submitStatus state and displayed in a red alert.
        setSubmitStatus({ type: "error", message: data.message || "Something went wrong. Please try again." });
      }
    } catch (error) {
      // Q: What if there's a network error and the fetch request never reaches the server?
      // A: The catch block runs, and a generic network error message is shown to the user.
      setSubmitStatus({ type: "error", message: "Network error. Please check your connection." });
    } finally {
      // Q: Why is the loading state stopped in a 'finally' block?
      // A: Because 'finally' always runs after a try/catch, ensuring the loading spinner is turned off whether the request succeeds or fails.
      setIsSubmitting(false);
    }
  };

  // Q: What data is used to create the stats bar near the top?
  // A: An array of objects, each with an icon component, a value string, and a label.
  const stats = [
    { icon: FaRocket, value: "24h", label: "Response Time" },
    { icon: FaStar, value: "4.9", label: "Customer Rating" },
    { icon: FaAward, value: "100%", label: "Satisfaction" },
    { icon: FaGlobe, value: "10k+", label: "Customers" }
  ];

  // Q: Where are the questions and answers for the FAQ section defined?
  // A: In a simple array of objects, each with a 'q' (question) and 'a' (answer) property.
  const faqs = [
    { q: "How fast do you respond?", a: "We typically respond within 24 hours during business days. For urgent matters, use WhatsApp for instant chat support." },
    { q: "What are your business hours?", a: "Monday to Friday: 9:00 AM - 6:00 PM, Saturday: 10:00 AM - 4:00 PM. We're closed on Sundays." },
    { q: "Do you ship internationally?", a: "Currently we ship within Lebanon. International shipping is coming soon!" },
    { q: "How can I track my order?", a: "Once your order ships, you'll receive a tracking number via email and WhatsApp." }
  ];

  return (
    <div className="contact-page">
      
      {/* Q: What creates the subtle dotted background effect? */}
      {/* A: An empty div with the class 'grid-background', which uses a CSS background-image pattern. */}
      <div className="grid-background" />

      {/* Q: How is the mouse-following glow positioned in the viewport? */}
      {/* A: Using inline styles. We calculate 'left' and 'top' by subtracting half the element's size (400px) from the mouse coordinates to center it. */}
      <div 
        className="mouse-glow"
        style={{
          left: mousePosition.x - 400,
          top: mousePosition.y - 400
        }}
      />

      {/* Q: How are the 5 animated horizontal lines created? */}
      {/* A: By creating an array of 5 items with [...Array(5)], mapping over it, and generating a div for each. Their position and animation are set via dynamic inline styles. */}
      <div className="animated-lines-container">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="animated-line"
            style={{
              top: `${20 + i * 20}%`,
              animationDuration: `${8 + i * 2}s`,
              animationDelay: `${i * 2}s`
            }}
          />
        ))}
      </div>

      {/* Q: How does the main page content fade into view? */}
      {/* A: Its class switches between 'visible' and 'hidden' based on the 'isVisible' boolean state. CSS handles the opacity transition. */}
      <div className={`main-content ${isVisible ? 'visible' : 'hidden'}`}>
        
        {/* Header Section */}
        <div className="header-section">
          <div className="header-glow" />
          <div className="header-container">
            {/* Q: How is the "Available 24/7" status shown? */}
            {/* A: A container with a green pulsing dot (span.status-dot) and text. */}
            <div className="status-indicator">
              <div className="status-dot" />
              <span className="status-text">Available 24/7</span>
            </div>
            <h1 className="main-heading">
              <span className="gradient-text">
                Let's Talk
              </span>
            </h1>
            <p className="sub-heading">
              Have a project in mind? Need support? We're here to help.{" "}
              <span className="highlight-text">Reach out</span> and we'll get back to you.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-section">
          <div className="stats-grid">
            {/* Q: How are the stat cards rendered from the 'stats' array? */}
            {/* A: We map over 'stats'. For each item, we render the icon component with <stat.icon />. */}
            {stats.map((stat, i) => (
              <div key={i} className="stat-card group">
                <div className="stat-card-overlay" />
                <div className="stat-card-content">
                  <stat.icon className="stat-icon" />
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Two-column layout */}
        <div className="main-layout">
          <div className="content-grid">
            
            {/* Left Column - Contact Info */}
            <div className="left-column">
              
              {/* Q: How are the contact info cards (phone, email, etc.) generated? */}
              {/* A: From a hardcoded array mapped directly in the JSX. Each item has an icon, color, title, value, and subtitle. The 'color' is used to dynamically build class names like 'bg-gradient-blue'. */}
              <div className="contact-cards-section">
                <h3 className="section-title">Contact Information</h3>
                {[
                  { icon: FaPhone, color: "blue", title: "Phone Number", value: "+961 76 883 284", sub: "Available during business hours" },
                  { icon: FaEnvelope, color: "purple", title: "Email Address", value: "alaa.alsayed003@gmail.com", sub: "We reply within 24 hours" },
                  { icon: FaWhatsapp, color: "green", title: "WhatsApp Chat", value: "+961 76 883 284", sub: "Quick response guaranteed" },
                  { icon: FaMapMarkerAlt, color: "orange", title: "Our Location", value: "Tyre, Lebanon", sub: "Smartify LB Headquarters" }
                ].map((item, i) => (
                  <div key={i} className="contact-card group">
                    <div className={`card-accent bg-gradient-${item.color}`} />
                    <div className="card-inner">
                      <div className={`card-icon-container border-${item.color} bg-${item.color}`}>
                        <item.icon className={`card-icon text-${item.color}`} />
                      </div>
                      <div className="card-text">
                        <div className="card-label">{item.title}</div>
                        <div className="card-value">{item.value}</div>
                        <div className="card-sub">{item.sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Q: How are open/closed days visually differentiated? */}
              {/* A: The 'hours-time' span gets an 'active' or 'inactive' class. An 'active-dot' span is only rendered if the schedule entry is active. */}
              <div className="hours-card">
                <h3 className="section-title hours-title">
                  <FaClock className="hours-icon" />
                  Business Hours
                </h3>
                <div className="hours-list">
                  {[
                    { day: "Monday - Friday", time: "9:00 AM - 6:00 PM", active: true },
                    { day: "Saturday", time: "10:00 AM - 4:00 PM", active: true },
                    { day: "Sunday", time: "Closed", active: false }
                  ].map((schedule, i) => (
                    <div key={i} className="hours-row">
                      <span className="hours-day">{schedule.day}</span>
                      <span className={`hours-time ${schedule.active ? 'active' : 'inactive'}`}>
                        {schedule.time}
                        {schedule.active && <span className="active-dot" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q: How are social media links rendered? */}
              {/* A: By mapping over an array of icon components directly. */}
              <div className="social-links">
                {[FaFacebook, FaInstagram, FaTwitter, FaLinkedin].map((Icon, i) => (
                  <a key={i} href="#" className="social-link">
                    <Icon className="social-icon" />
                  </a>
                ))}
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="right-column">
              <div ref={formRef} className="form-container">
                
                {/* Q: How does the 1-2-3 step indicator work? */}
                {/* A: It loops through [1, 2, 3]. A step circle is 'active' if currentStep >= the step number. A '✓' checkmark is shown if currentStep > step. Connector lines between them are also colored based on progress. */}
                <div className="steps-container">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="step-item">
                      <div className={`step-circle ${currentStep >= step ? 'active' : 'inactive'}`}>
                        {currentStep > step ? '✓' : step}
                      </div>
                      {step < 3 && <div className={`step-connector ${currentStep > step ? 'active' : 'inactive'}`} />}
                    </div>
                  ))}
                  <span className="step-label">
                    Step {currentStep} of 3: {currentStep === 1 ? 'Your Info' : currentStep === 2 ? 'Message Details' : 'Review & Send'}
                  </span>
                </div>

                {/* Q: When is the green success message displayed? */}
                {/* A: Only when the 'submitStatus' state exists and its type is exactly "success". */}
                {submitStatus?.type === "success" && (
                  <div className="success-message">
                    <div className="success-icon-container">
                      <FaCheckCircle className="success-icon" />
                    </div>
                    <div>
                      <p className="success-title">Message Delivered!</p>
                      <p className="success-text">{submitStatus.message}</p>
                    </div>
                  </div>
                )}

                {/* Q: When is the red error message displayed? */}
                {/* A: Only when the 'submitStatus' state exists and its type is exactly "error". */}
                {submitStatus?.type === "error" && (
                  <div className="error-message">
                    <p className="error-text">{submitStatus.message}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="form-content">
                  
                  {/* STEP 1 */}
                  {/* Q: How is the first step of the form shown? */}
                  {/* A: The entire block is wrapped in {currentStep === 1 && (...)}. It only renders when currentStep is 1. */}
                  {currentStep === 1 && (
                    <div className="step-content">
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                          <option value="general" className="select-option">💬 General Inquiry</option>
                          <option value="order" className="select-option">📦 Order Issue</option>
                          <option value="support" className="select-option">🔧 Technical Support</option>
                          <option value="feedback" className="select-option">💡 Feedback</option>
                          <option value="business" className="select-option">🤝 Partnership</option>
                        </select>
                      </div>

                      <div className="form-row">
                        {/* Q: How is a specific error shown for the name field? */}
                        {/* A: If errors.name is truthy, the input border turns red, and a <p> tag with the error message is rendered below the input. */}
                        <div className="form-group">
                          <label className="form-label">Full Name *</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange}
                            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                            placeholder="Alaa EL Sayed"
                            className={`form-input ${errors.name ? 'input-error' : focusedField === 'name' ? 'input-focused-blue' : 'input-default'}`} />
                          {errors.name && <p className="field-error">{errors.name}</p>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange}
                            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                            placeholder="you@email.com"
                            className={`form-input ${errors.email ? 'input-error' : focusedField === 'email' ? 'input-focused-purple' : 'input-default'}`} />
                          {errors.email && <p className="field-error">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Phone <span className="optional-label">(optional, for WhatsApp confirmation)</span>
                        </label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                         // When user clicks/tabs INTO the phone input field
                        // When user clicks/tabs OUT of the phone input field

                          onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                          placeholder="+961 76 883 284"
                          className={`form-input ${focusedField === 'phone' ? 'input-focused-green' : 'input-default'}`} />
                      </div>

                      {/* Q: How does the user move to Step 2? */}
                      {/* A: By clicking the "Continue" button, which has an onClick handler that simply sets currentStep to 2. */}
                      <button type="button" onClick={() => setCurrentStep(2)} className="btn-continue">
                        Continue <FaChevronRight className="btn-icon" />
                      </button>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {currentStep === 2 && (
                    <div className="step-content">
                      <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange}
                          onFocus={() => setFocusedField('subject')} onBlur={() => setFocusedField(null)}
                          placeholder="What's this about?"
                          className={`form-input ${errors.subject ? 'input-error' : focusedField === 'subject' ? 'input-focused-pink' : 'input-default'}`} />
                        {errors.subject && <p className="field-error">{errors.subject}</p>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea name="message" value={formData.message} onChange={handleChange}
                          onFocus={() => setFocusedField('message')} onBlur={() => setFocusedField(null)}
                          placeholder="Tell us everything..."
                          rows="6"
                          className={`form-textarea ${errors.message ? 'input-error' : focusedField === 'message' ? 'input-focused-orange' : 'input-default'}`} />
                        <div className="textarea-footer">
                          {errors.message && <p className="field-error">{errors.message}</p>}
                          {/* Q: How is the live character count shown? */}
                          {/* A: Directly in the JSX with {formData.message.length}. */}
                          <p className="char-count">{formData.message.length} / 1000</p>
                        </div>
                      </div>

                      <div className="button-row">
                        <button type="button" onClick={() => setCurrentStep(1)} className="btn-back">Back</button>
                        <button type="button" onClick={() => setCurrentStep(3)} className="btn-review">
                          Review <FaChevronRight className="btn-icon" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {currentStep === 3 && (
                    <div className="step-content">
                      <div className="review-card">
                        <h4 className="review-title">Review Your Message</h4>
                        {/* Q: How is the data for the review card structured? */}
                        {/* A: As an array of {label, value} objects mapped in the JSX. */}
                        {[
                          { label: "Category", value: formData.category },
                          { label: "Name", value: formData.name },
                          { label: "Email", value: formData.email },
                          { label: "Phone", value: formData.phone || "Not provided" },
                          { label: "Subject", value: formData.subject }
                        ].map((item, i) => (
                          <div key={i} className="review-row">
                            <span className="review-label">{item.label}</span>
                            <span className="review-value">{item.value}</span>
                          </div>
                        ))}
                        <div className="review-message">
                          <span className="review-message-label">Message</span>
                          <p className="review-message-text">{formData.message}</p>
                        </div>
                      </div>

                      <div className="button-row">
                        <button type="button" onClick={() => setCurrentStep(2)} className="btn-edit">Edit</button>
                        {/* Q: What happens to the submit button while the form is sending? */}
                        {/* A: It becomes disabled (disabled={isSubmitting}), its opacity drops, and the text changes to "Sending..." with a spinning SVG icon. */}
                        <button type="submit" disabled={isSubmitting} className="btn-submit">
                          <div className="btn-submit-overlay" />
                          <span className="btn-submit-content">
                            {isSubmitting ? (
                              <>
                                <svg className="spinner" viewBox="0 0 24 24">
                                  <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                <FaPaperPlane className="btn-submit-icon" />
                                Send Message
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                </form>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-container">
            <div className="faq-header">
              <h2 className="faq-heading">Frequently Asked Questions</h2>
              <p className="faq-subheading">Quick answers to common questions</p>
            </div>
            <div className="faq-list">
              {/* Q: How does the FAQ accordion toggle open and close? */}
              {/* A: Clicking a question button calls setActiveFAQ(). If the clicked item's index 'i' matches the currently active one, it sets it to null (closes it). Otherwise, it sets it to 'i' (opens it). */}
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button
                    onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}
                    className="faq-question"
                  >
                    <span className="faq-question-text">{faq.q}</span>
                    {/* Q: How does the "+" icon become an "x"? */}
                    {/* A: The 'active' class is added when activeFAQ === i, which uses a CSS transform to rotate the "+" 45 degrees. */}
                    <span className={`faq-toggle ${activeFAQ === i ? 'active' : ''}`}>+</span>
                  </button>
                  {/* Q: How is the answer shown only for the active FAQ? */}
                  {/* A: With conditional rendering: {activeFAQ === i && (...)} */}
                  {activeFAQ === i && (
                    <div className="faq-answer">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="cta-section">
          <div className="cta-container">
            <FaQuoteLeft className="cta-quote-icon" />
            <p className="cta-quote">
              "The best customer service is if the customer doesn't need to call you. But if they do, make it exceptional."
            </p>
            <div className="cta-founder">
              <div className="founder-avatar" />
              <div className="founder-info">
                <p className="founder-name">Alaa & Mahdi</p>
                <p className="founder-title">Founder, CEO's of Smartify LB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;