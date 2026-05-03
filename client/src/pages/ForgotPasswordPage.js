import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle, FaLock, FaKey } from "react-icons/fa";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: "email" })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetToken(data.resetToken);
        setSuccess(data.message);
        setStep(2);
        startCountdown();
      } else {
        setError(data.message || "Failed to send code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetToken(data.resetToken);
        setSuccess("Code verified! Set your new password.");
        setStep(3);
      } else {
        setError(data.message || "Invalid code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/resend-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: "email" })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("New code sent to your email!");
        startCountdown();
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resetToken, 
          newPassword, 
          confirmPassword 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to login...");
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

  const goBack = () => {
    if (step === 1) {
      navigate("/login");
    } else {
      setStep(step - 1);
      setError("");
      setSuccess("");
    }
  };

  return (
    <div className="login-container" style={{
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1508780709619-79562169bc64?q=80&w=2048') center/cover no-repeat fixed`,
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        animation: "fadeInUp 0.5s ease"
      }}>
        <button
          onClick={goBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#667eea",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <FaArrowLeft /> Back to Login
        </button>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: "70px",
            height: "70px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px"
          }}>
            <FaLock size={30} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: "26px", color: "#333" }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "Verify Code"}
            {step === 3 && "Create New Password"}
          </h2>
          <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && `We've sent a 6-digit code to ${email}`}
            {step === 3 && "Create a strong new password"}
          </p>
        </div>
        
        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "20px",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            padding: "12px",
            marginBottom: "20px",
            background: "#d4edda",
            color: "#155724",
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <FaCheckCircle /> {success}
          </div>
        )}
        
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
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
                    padding: "14px 14px 14px 45px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                We'll send a 6-digit reset code to your email
              </p>
            </div>
            
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
                opacity: loading ? 0.7 : 1,
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
              }}
            >
              {loading ? <FaSpinner className="spinner" /> : "Send Reset Code"}
            </button>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength="6"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontWeight: "bold"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              <p style={{ fontSize: "12px", color: "#888", marginTop: "8px", textAlign: "center" }}>
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            
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
            
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: canResend ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                opacity: canResend ? 1 : 0.5
              }}
            >
              {canResend ? "Resend Code" : `Resend in ${countdown}s`}
            </button>
          </form>
        )}
        
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <FaKey style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999"
                }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
            
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999"
                }} />
                <input
                  type="password"
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
        
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
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