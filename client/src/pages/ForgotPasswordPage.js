// Import React core and useState hook for state management
import React, { useState } from "react";
// Import navigation hook for programmatic routing
import { useNavigate } from "react-router-dom";
// Import icons from react-icons library for visual elements
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle, FaLock, FaKey } from "react-icons/fa";

/**
 * ForgotPasswordPage Component
 * A multi-step password reset flow with three stages:
 * 1. Email entry - User provides their registered email
 * 2. Code verification - User enters the 6-digit code sent to their email
 * 3. New password creation - User sets and confirms a new password
 */
const ForgotPasswordPage = () => {
  // Navigation hook for redirecting to different routes
  const navigate = useNavigate();
  
  // Tracks which step of the reset flow is currently active (1, 2, or 3)
  const [step, setStep] = useState(1);
  
  // Form input states for each step of the process
  const [email, setEmail] = useState("");                 // User's email address
  const [code, setCode] = useState("");                   // 6-digit verification code
  const [newPassword, setNewPassword] = useState("");     // New password (step 3)
  const [confirmPassword, setConfirmPassword] = useState(""); // Password confirmation (step 3)
  
  // Security token received from server after email/code verification
  // Required for the final password reset API call
  const [resetToken, setResetToken] = useState("");
  
  // UI state management
  const [loading, setLoading] = useState(false);    // Shows spinner during API calls
  const [error, setError] = useState("");           // Error message display
  const [success, setSuccess] = useState("");       // Success message display
  
  // Countdown timer for resend functionality
  const [countdown, setCountdown] = useState(0);    // Seconds remaining until resend available
  const [canResend, setCanResend] = useState(true); // Whether resend button is active

  /**
   * Step 1: Send password reset code to user's email
   * Validates email input and makes API call to initiate reset process
   * On success: stores reset token, shows success message, advances to step 2
   */
  const handleSendCode = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Client-side validation: ensure email is provided
    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setLoading(true);  // Show loading spinner
    setError("");      // Clear any previous errors
    
    try {
      // API call to initiate forgot password process
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: "email" }) // Send email with "email" delivery method
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetToken(data.resetToken);  // Store token for later verification
        setSuccess(data.message);        // Show success message from server
        setStep(2);                      // Advance to code verification step
        startCountdown();                // Begin 60-second cooldown for resend button
      } else {
        setError(data.message || "Failed to send code");
      }
    } catch (error) {
      // Handle network errors (server down, no internet, etc.)
      setError("Network error. Please try again.");
    } finally {
      setLoading(false); // Always hide spinner, regardless of success/failure
    }
  };

  /**
   * Step 2: Verify the 6-digit code sent to user's email
   * Validates code format and makes API call to verify
   * On success: stores new reset token, shows success, advances to step 3
   */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    // Validate code format: must be exactly 6 digits
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // API call to verify the reset code
      const response = await fetch("http://localhost:5000/api/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }) // Send both email and code for verification
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetToken(data.resetToken);  // Update token for password reset step
        setSuccess("Code verified! Set your new password.");
        setStep(3);                      // Advance to password creation step
      } else {
        setError(data.message || "Invalid code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification code to user's email
   * Only available when canResend is true (after cooldown period)
   * Restarts the countdown timer on success
   */
  const handleResendCode = async () => {
    if (!canResend) return; // Guard clause: prevent multiple rapid resends
    
    setLoading(true);
    setError("");
    
    try {
      // API call to resend the verification code
      const response = await fetch("http://localhost:5000/api/resend-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: "email" })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("New code sent to your email!");
        startCountdown(); // Restart the 60-second cooldown
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start/reset the countdown timer for resend button
   * Sets a 60-second cooldown before user can request another code
   * Uses setInterval to update countdown every second
   */
  const startCountdown = () => {
    setCanResend(false);    // Disable resend button
    setCountdown(60);       // Set initial countdown to 60 seconds
    
    // Create interval that decrements countdown every second
    const timer = setInterval(() => {
      setCountdown(prev => {
        // When countdown reaches 1 (about to hit 0)
        if (prev <= 1) {
          clearInterval(timer);   // Stop the timer
          setCanResend(true);     // Re-enable resend button
          return 0;               // Reset countdown display to 0
        }
        return prev - 1;          // Decrement countdown
      });
    }, 1000); // Execute every 1000ms (1 second)
  };

  /**
   * Step 3: Reset the password with the new credentials
   * Validates password length, match confirmation, and makes final API call
   * On success: shows success message and redirects to login after 3 seconds
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Client-side validation: password must be at least 6 characters
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    // Client-side validation: passwords must match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Final API call to complete password reset
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resetToken,        // Security token from previous steps
          newPassword,       // New password
          confirmPassword    // Password confirmation (server may double-check)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to login...");
        // Redirect to login page after 3-second delay to show success message
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigation handler for the back button
   * If on step 1: returns to login page
   * If on step 2 or 3: goes to previous step in the reset flow
   * Clears any error/success messages when navigating back
   */
  const goBack = () => {
    if (step === 1) {
      navigate("/login");  // Redirect to login if on first step
    } else {
      setStep(step - 1);   // Go to previous step
      setError("");        // Clear messages
      setSuccess("");
    }
  };

  // Component render
  return (
    // Main container with background image overlay
    <div className="login-container" style={{
      // Dark overlay gradient on top of a background image
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1508780709619-79562169bc64?q=80&w=2048') center/cover no-repeat fixed`,
      minHeight: "100vh",  // Full viewport height
      display: "flex",
      justifyContent: "center",  // Center horizontally
      alignItems: "center",      // Center vertically
      padding: "20px"            // Padding for mobile devices
    }}>
      {/* White card container with rounded corners and shadow */}
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "500px",        // Limit card width on large screens
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",  // Depth shadow
        animation: "fadeInUp 0.5s ease"  // Entrance animation
      }}>
        {/* Back button - changes behavior based on current step */}
        <button
          onClick={goBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",           // Space between icon and text
            color: "#667eea",     // Purple theme color
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <FaArrowLeft /> Back to Login
        </button>
        
        {/* Header section with icon and dynamic title based on current step */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          {/* Gradient icon container */}
          <div style={{
            width: "70px",
            height: "70px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",  // Purple gradient
            borderRadius: "20px",   // Rounded square shape
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px"   // Center horizontally with bottom margin
          }}>
            <FaLock size={30} color="white" />  {/* Lock icon representing security */}
          </div>
          
          {/* Dynamic title based on current step */}
          <h2 style={{ margin: 0, fontSize: "26px", color: "#333" }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "Verify Code"}
            {step === 3 && "Create New Password"}
          </h2>
          
          {/* Dynamic instructional text based on current step */}
          <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && `We've sent a 6-digit code to ${email}`}
            {step === 3 && "Create a strong new password"}
          </p>
        </div>
        
        {/* Conditional rendering: Error message (if exists) */}
        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "20px",
            background: "#fee2e2",   // Light red background
            color: "#dc2626",        // Dark red text
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        {/* Conditional rendering: Success message (if exists) */}
        {success && (
          <div style={{
            padding: "12px",
            marginBottom: "20px",
            background: "#d4edda",   // Light green background
            color: "#155724",        // Dark green text
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"               // Space between icon and text
          }}>
            <FaCheckCircle /> {success}  {/* Green checkmark icon */}
          </div>
        )}
        
        {/* Step 1: Email Entry Form */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            {/* Email input field */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Email Address
              </label>
              {/* Input container with icon positioning */}
              <div style={{ position: "relative" }}>
                {/* Email icon positioned absolutely inside the input */}
                <FaEnvelope style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",  // Perfect vertical centering
                  color: "#999"
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 45px",  // Extra left padding for icon
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    transition: "all 0.3s"  // Smooth border color transition
                  }}
                  // Dynamic border color on focus/blur for interactivity
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
              {/* Helper text below email input */}
              <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                We'll send a 6-digit reset code to your email
              </p>
            </div>
            
            {/* Submit button with gradient background */}
            <button
              type="submit"
              disabled={loading}  // Disable during API call
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",  // Change cursor when disabled
                opacity: loading ? 0.7 : 1,  // Reduce opacity when loading
                transition: "transform 0.2s"  // Smooth hover animation
              }}
              // Hover effect: slight lift animation
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
              }}
            >
              {/* Show spinner when loading, otherwise show button text */}
              {loading ? <FaSpinner className="spinner" /> : "Send Reset Code"}
            </button>
          </form>
        )}
        
        {/* Step 2: Code Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            {/* Code input field with special styling for OTP-like appearance */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength="6"         // Limit to 6 characters
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  fontSize: "20px",       // Larger font for code digits
                  textAlign: "center",    // Center the code
                  letterSpacing: "8px",   // Space out digits for readability
                  fontWeight: "bold"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              {/* Display the email where code was sent */}
              <p style={{ fontSize: "12px", color: "#888", marginTop: "8px", textAlign: "center" }}>
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            
            {/* Verify code button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <FaSpinner className="spinner" /> : "Verify Code"}
            </button>
            
            {/* Resend code button with countdown timer */}
            <button
              type="button"  // Not a submit button to prevent form submission
              onClick={handleResendCode}
              disabled={!canResend || loading}  // Disabled during cooldown or loading
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                background: "none",  // Ghost button style
                border: "none",
                color: "#667eea",
                cursor: canResend ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                opacity: canResend ? 1 : 0.5  // Faded when disabled
              }}
            >
              {/* Dynamic text: either "Resend Code" or "Resend in Xs" */}
              {canResend ? "Resend Code" : `Resend in ${countdown}s`}
            </button>
          </form>
        )}
        
        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            {/* New password input field */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                {/* Key icon positioned inside the input */}
                <FaKey style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999"
                }} />
                <input
                  type="password"  // Masked input for security
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 45px",  // Left padding for key icon
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
            
            {/* Confirm password input field */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                {/* Lock icon positioned inside the input */}
                <FaLock style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999"
                }} />
                <input
                  type="password"  // Masked input for security
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 45px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
            
            {/* Reset password button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <FaSpinner className="spinner" /> : "Reset Password"}
            </button>
          </form>
        )}
        
        {/* Inline CSS animations for page entrance and spinner */}
        <style>{`
          /* Fade-in animation for the card */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);  /* Start below final position */
            }
            to {
              opacity: 1;
              transform: translateY(0);     /* End at natural position */
            }
          }
          
          /* Continuous rotation animation for loading spinner */
          .spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;