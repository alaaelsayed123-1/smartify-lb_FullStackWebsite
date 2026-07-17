// ============================================================
// SMARTIFY LB - LOGIN PAGE COMPONENT
// ============================================================
// This component handles the complete login flow including:
// 1. Email/Password authentication
// 2. 2FA method selection (Email code, Face Recognition, Face ID)
// 3. Redirect to appropriate verification component
// 4. Final authentication and navigation to home page
// ============================================================

// ============================================================
// IMPORT DEPENDENCIES
// ============================================================
import React, { useState } from 'react'; // React and useState hook for state management
import { useNavigate } from 'react-router-dom'; // For programmatic navigation after login
import { useAuth } from '../context/AuthContext'; // Custom auth context for storing user session
import FaceIDAuth from '../components/FaceIDAuth'; // Windows Hello/Face ID biometric component
import Verify2FA from '../components/Verify2FA'; // Email verification code component
import FaceRecognition from '../components/FaceRecognition'; // Camera-based face recognition component
import { FaEnvelope, FaLock, FaSpinner, FaUserCircle, FaCamera } from 'react-icons/fa'; // Icons for UI

const LoginPage = () => {
  // ============================================================
  // HOOKS & CONTEXT
  // ============================================================
  const navigate = useNavigate(); // For redirecting after successful login
  const { login } = useAuth(); // Auth context function to store user session globally

  // ============================================================
  // LOGIN FORM STATE
  // ============================================================
  const [email, setEmail] = useState(''); // User's email input
  const [password, setPassword] = useState(''); // User's password input
  const [loading, setLoading] = useState(false); // Shows spinner on login button during API call
  const [error, setError] = useState(''); // Displays error messages to user

  // ============================================================
  // 2FA FLOW STATE
  // ============================================================
  const [show2FAMethods, setShow2FAMethods] = useState(false); // Toggles between login form and 2FA selection screen
  const [customerData, setCustomerData] = useState(null); // Stores partial customer data from initial login attempt (before 2FA)
  const [selectedMethod, setSelectedMethod] = useState(null); // Tracks which 2FA method user chose: 'email', 'faceid', or 'camera'

  // ============================================================
  // FEATURE AVAILABILITY STATE
  // ============================================================
  const [hasFaceID, setHasFaceID] = useState(false); // Whether user has Windows Hello/Face ID set up
  const [hasFaceData, setHasFaceData] = useState(false); // Whether user has face recognition data saved

  // ============================================================
  // HANDLE INITIAL LOGIN SUBMISSION
  // ============================================================
  // Step 1: Validates email/password
  // Step 2: Sends credentials to backend
  // Step 3: If 2FA is required (status 202), checks available 2FA methods
  // Step 4: If no 2FA, logs in directly with returned token
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    setLoading(true); // Show loading spinner on button
    setError(''); // Clear any previous errors

    // Validate that both fields are filled
    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    try {
      // ============================================================
      // API CALL: Attempt login with email and password
      // ============================================================
      const response = await fetch('http://localhost:5000/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // Send credentials as JSON
      });

      const data = await response.json(); // Parse server response

      // ============================================================
      // CASE 1: DIRECT LOGIN (No 2FA required)
      // ============================================================
      // Response is OK (200) and contains a token
      // User has 2FA disabled, so login immediately
      // ============================================================
      if (response.ok && data.token) {
        login(data.customer, data.token); // Store user in auth context
        navigate('/'); // Redirect to home page
      } 
      // ============================================================
      // CASE 2: 2FA REQUIRED (Status 202)
      // ============================================================
      // Backend indicates that 2FA verification is needed
      // Check which 2FA methods are available for this user
      // ============================================================
      else if (response.status === 202 && data.requires2FA) {
        // Check if user has Face ID (Windows Hello) set up
        const faceIDCheck = await fetch('http://localhost:5000/api/face-id/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const faceIDData = await faceIDCheck.json();
        
        // Check if user has face recognition data (camera-based)
        const faceDataCheck = await fetch('http://localhost:5000/api/check-face-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const faceDataResult = await faceDataCheck.json();
        
        // Update state with available 2FA methods
        setHasFaceID(faceIDData.hasFaceID); // true/false for Windows Hello
        setHasFaceData(faceDataResult.hasFaceData); // true/false for camera face data
        setCustomerData(data); // Store partial login data (contains customerId, etc.)
        setShow2FAMethods(true); // Switch to 2FA method selection screen
        setError(''); // Clear any errors
      } 
      // ============================================================
      // CASE 3: LOGIN FAILED
      // ============================================================
      else {
        setError(data.message || 'Login failed'); // Show backend error message
      }
    } catch (err) {
      // Network or server error
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false); // Hide loading spinner regardless of outcome
    }
  };

  // ============================================================
  // HANDLE SUCCESSFUL 2FA VERIFICATION
  // ============================================================
  // Called when any 2FA method succeeds
  // Stores the authenticated user in context
  // Redirects to home page
  // ============================================================
  const handle2FASuccess = (customer, token) => {
    login(customer, token); // Store authenticated user globally
    navigate('/'); // Redirect to main application
  };

  // ============================================================
  // HANDLE FACE RECOGNITION SUCCESS
  // ============================================================
  // Specific handler for camera-based face recognition
  // After face is verified, sends confirmation to backend
  // Backend returns final JWT token for login
  // ============================================================
  const handleFaceSuccess = async (verified) => {
    if (verified) {
      // Notify backend that face ID verification was successful
      const response = await fetch('http://localhost:5000/api/face-id/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, faceIdVerified: true })
      });
      const data = await response.json();
      
      // If backend confirms, complete the login
      if (data.success) {
        handle2FASuccess(data.customer, data.token);
      }
    }
  };

  // ============================================================
  // RENDER: 2FA METHOD SELECTION SCREEN
  // ============================================================
  // Shown when user needs to choose how to verify their identity
  // Displays available methods based on what user has set up
  // Methods: Camera (face recognition), Face ID (Windows Hello), Email code
  // ============================================================
  if (show2FAMethods && !selectedMethod) {
    return (
      <div className="login-container">
        <div className="login-card">
          {/* Title and subtitle */}
          <h2>Two-Factor Authentication</h2>
          <p className="subtitle">Choose how to verify your identity</p>
          
          {/* ---------------------------------------------------------- */}
          {/* OPTION 1: FACE RECOGNITION (Camera) - Only if hasFaceData is true */}
          {/* ---------------------------------------------------------- */}
          {hasFaceData && (
            <button
              onClick={() => setSelectedMethod('camera')} // Switch to camera verification
              className="auth-method-btn camera"
            >
              <FaCamera className="method-icon" /> {/* Camera icon in green */}
              <div className="method-info">
                <h3>Face Recognition</h3>
                <p>Use camera to verify your face</p>
              </div>
              <span className="arrow">→</span> {/* Arrow indicator */}
            </button>
          )}
          
          {/* ---------------------------------------------------------- */}
          {/* OPTION 2: WINDOWS HELLO / FACE ID - Only if hasFaceID is true */}
          {/* ---------------------------------------------------------- */}
          {hasFaceID && (
            <button
              onClick={() => setSelectedMethod('faceid')} // Switch to device biometrics
              className="auth-method-btn faceid"
            >
              <FaUserCircle className="method-icon" /> {/* User/profile icon in purple */}
              <div className="method-info">
                <h3>Windows Hello / Face ID</h3>
                <p>Use device biometrics</p>
              </div>
              <span className="arrow">→</span> {/* Arrow indicator */}
            </button>
          )}
          
          {/* ---------------------------------------------------------- */}
          {/* OPTION 3: EMAIL VERIFICATION CODE - Always available */}
          {/* ---------------------------------------------------------- */}
          <button
            onClick={() => setSelectedMethod('email')} // Switch to email code verification
            className="auth-method-btn email"
          >
            <FaEnvelope className="method-icon" /> {/* Email icon in red/pink */}
            <div className="method-info">
              <h3>Email Verification Code</h3>
              <p>Receive 6-digit code via email</p>
            </div>
            <span className="arrow">→</span> {/* Arrow indicator */}
          </button>
          
          {/* ---------------------------------------------------------- */}
          {/* BACK TO LOGIN BUTTON */}
          {/* ---------------------------------------------------------- */}
          {/* Resets all 2FA state and returns to email/password form */}
          <button onClick={() => {
            setShow2FAMethods(false); // Hide 2FA screen
            setSelectedMethod(null); // Reset method selection
            setCustomerData(null); // Clear partial login data
            setPassword(''); // Clear password for security
          }} className="back-btn">
            ← Back to Login
          </button>
        </div>
        
        {/* ============================================================ */}
        {/* INLINE STYLES FOR 2FA SELECTION SCREEN */}
        {/* ============================================================ */}
        <style>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Purple gradient background */
            padding: 20px;
          }
          .login-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); /* Deep shadow for depth */
          }
          .login-card h2 {
            font-size: 1.8rem;
            color: #333;
            margin-bottom: 10px;
            text-align: center;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }
          /* Method selection buttons - card-style with hover animation */
          .auth-method-btn {
            width: 100%;
            padding: 20px;
            margin: 10px 0;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
            text-align: left;
          }
          .auth-method-btn:hover {
            border-color: #667eea; /* Purple border on hover */
            transform: translateX(5px); /* Slide right on hover */
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2); /* Purple shadow */
          }
          .method-icon {
            font-size: 32px; /* Large icon size */
          }
          /* Color coding for different methods */
          .auth-method-btn.camera .method-icon { color: #28a745; } /* Green for camera */
          .auth-method-btn.faceid .method-icon { color: #667eea; } /* Purple for Face ID */
          .auth-method-btn.email .method-icon { color: #f5576c; } /* Red/pink for email */
          .method-info {
            flex: 1; /* Takes remaining space */
          }
          .method-info h3 {
            margin: 0 0 5px 0;
            font-size: 1.1rem;
            color: #333;
          }
          .method-info p {
            margin: 0;
            font-size: 0.8rem;
            color: #666;
          }
          .arrow {
            font-size: 1.2rem;
            color: #999;
          }
          .back-btn {
            width: 100%;
            margin-top: 20px;
            padding: 12px;
            background: none;
            border: none;
            color: #667eea;
            cursor: pointer;
            font-size: 0.9rem;
          }
          .back-btn:hover {
            text-decoration: underline;
          }
          .error-message {
            background: #fee; /* Light red background */
            color: #c33; /* Dark red text */
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 0.9rem;
          }
          .animate-spin {
            animation: spin 1s linear infinite; /* Rotating animation for spinner */
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER: FACE ID / WINDOWS HELLO VERIFICATION
  // ============================================================
  // Shown when user selects device biometric authentication
  // Uses the FaceIDAuth component for platform-specific biometrics
  // ============================================================
  if (selectedMethod === 'faceid') {
    return (
      <div className="login-container">
        <div className="login-card">
          {/* FaceIDAuth component handles Windows Hello / Apple Face ID */}
          <FaceIDAuth
            email={email} // Pass email for identification
            onSuccess={(data) => handle2FASuccess(data.customer, data.token)} // Handle success
            onError={(err) => setError(err)} // Display errors
            buttonText="Login" // Button text for  prompt
          />
          {/* Navigation back to method selection */}
          <button onClick={() => setSelectedMethod(null)} className="back-btn">
            ← Other verification methods
          </button>
          {/* Error display */}
          {error && <div className="error-message mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: CAMERA-BASED FACE RECOGNITION
  // ============================================================
  // Shown when user selects camera face verification
  // Uses the FaceRecognition component in 'login' mode
  // ============================================================
  if (selectedMethod === 'camera') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Face Verification</h2>
          {/* FaceRecognition component captures and verifies face */}
          <FaceRecognition
            email={email} // Pass email for identification
            mode="login" // Set to login mode (verifies against stored face data)
            onSuccess={handleFaceSuccess} // Handle successful face match
            onError={(err) => setError(err)} // Display errors
            onCancel={() => setSelectedMethod(null)} // Return to method selection
          />
          {/* Navigation back to method selection */}
          <button onClick={() => setSelectedMethod(null)} className="back-btn">
            ← Back to verification methods
          </button>
          {/* Error display */}
          {error && <div className="error-message mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: EMAIL VERIFICATION CODE (Verify2FA)
  // ============================================================
  // Shown when user selects email code verification
  // Uses the Verify2FA component for 6-digit code entry
  // ============================================================
  if (selectedMethod === 'email') {
    return (
      <Verify2FA
        email={email} // Email to send code to
        customerId={customerData?.customerId} // Customer ID from initial login
        onSuccess={handle2FASuccess} // Handle successful verification
        onCancel={() => {
          setSelectedMethod(null); // Reset method selection
          setShow2FAMethods(true); // Return to method selection screen
        }}
      />
    );
  }

  // ============================================================
  // RENDER: DEFAULT LOGIN FORM (Email/Password)
  // ============================================================
  // This is the initial screen users see
  // Collects email and password, then attempts login
  // ============================================================
  return (
    <div className="login-container">
      <div className="login-card">
        {/* ============================================================ */}
        {/* HEADER SECTION */}
        {/* ============================================================ */}
        <div className="text-center mb-6">
          {/* Brand logo - Blue to purple gradient circle with "S" */}
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          {/* Welcome heading */}
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Login to your Smartify account</p>
        </div>
        
        {/* ============================================================ */}
        {/* ERROR MESSAGE DISPLAY */}
        {/* ============================================================ */}
        {error && <div className="error-message">{error}</div>}
        
        {/* ============================================================ */}
        {/* LOGIN FORM */}
        {/* ============================================================ */}
        <form onSubmit={handleSubmit}>
          {/* Email input with envelope icon */}
          <div className="input-group">
            <FaEnvelope className="input-icon" /> {/* Email icon */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update email state
              required // HTML5 validation
            />
          </div>
          
          {/* Password input with lock icon */}
          <div className="input-group">
            <FaLock className="input-icon" /> {/* Lock icon */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update password state
              required // HTML5 validation
            />
          </div>
          
          {/* Submit button - shows spinner when loading */}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> {/* Spinning icon */}
                Logging in... {/* Loading text */}
              </>
            ) : (
              'Login' // Default text
            )}
          </button>
        </form>
        
        {/* ============================================================ */}
        {/* FORGOT PASSWORD LINK */}
        {/* ============================================================ */}
        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
            Forgot password?
          </a>
        </div>
        
        {/* ============================================================ */}
        {/* SIGN UP LINK */}
        {/* ============================================================ */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </a>
        </div>
      </div>
      
      {/* ============================================================ */}
      {/* INLINE STYLES FOR LOGIN FORM */}
      {/* ============================================================ */}
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Purple gradient */
          padding: 20px;
        }
        .login-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3); /* Depth shadow */
        }
        .input-group {
          position: relative; /* For absolute positioning of icon */
          margin-bottom: 20px;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%); /* Center icon vertically */
          color: #999; /* Gray icon color */
        }
        .input-group input {
          width: 100%;
          padding: 14px 15px 14px 45px; /* Left padding makes room for icon */
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea; /* Purple border on focus */
        }
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Purple gradient button */
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px; /* Space between icon and text */
        }
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px); /* Lift effect on hover */
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); /* Purple glow */
        }
        .login-button:disabled {
          opacity: 0.7; /* Faded appearance */
          cursor: not-allowed; /* Show disabled cursor */
        }
        .error-message {
          background: #fee; /* Light red background */
          color: #c33; /* Dark red text */
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 0.9rem;
        }
        .animate-spin {
          animation: spin 1s linear infinite; /* Rotating animation */
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// EXPORT LOGIN PAGE COMPONENT
// ============================================================
export default LoginPage;