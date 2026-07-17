  import React, { useState, useRef } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  import FaceRecognition from '../components/FaceRecognition';

  const Signup = () => {
    // ============================================================
    // HOOKS & NAVIGATION
    // ============================================================
    const navigate = useNavigate();  // For redirecting after signup
    const { login } = useAuth();     // Auth context for storing user session

    // ============================================================
    // FORM DATA STATE
    // ============================================================
    // Stores all user input fields
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });

    // ============================================================
    // FEATURE TOGGLES
    // ============================================================
    const [enableFaceRecognition, setEnableFaceRecognition] = useState(false);  // Face login toggle
    const [enable2FA, setEnable2FA] = useState(true);                           // 2FA toggle (ON by default for security)

    // ============================================================
    // FACE RECOGNITION STATE
    // ============================================================
    const [faceRegistered, setFaceRegistered] = useState(false);      // Tracks if face was captured
    const [faceDataToSave, setFaceDataToSave] = useState(null);       // Stores face descriptor temporarily

    // ============================================================
    // UI STATE
    // ============================================================
    const [loading, setLoading] = useState(false);  // Disables form during submission
    const [error, setError] = useState('');         // Error message display

    // ============================================================
    // HANDLE INPUT CHANGES
    // ============================================================
    // Updates formData when user types in any input field
    // Uses computed property name [e.target.name] to handle all fields
    const handleChange = (e) => {
      setFormData({
        ...formData,                        // Keep all existing values
        [e.target.name]: e.target.value     // Update only the changed field
      });
    };

    // ============================================================
    // HANDLE FACE REGISTRATION SUCCESS
    // ============================================================
    // Called by FaceRecognition component when face is captured
    // Only accepts valid face data with a descriptor (128 numbers)
    const handleFaceRegistered = (faceData) => {
      // Check if we received valid face data with descriptor
      if (faceData && faceData.descriptor) {
        setFaceRegistered(true);          // Mark face as registered
        setFaceDataToSave(faceData);      // Store for later saving
        setError('');                     // Clear any previous errors
      } else {
        // No face detected - clear everything
        setFaceRegistered(false);
        setFaceDataToSave(null);
      }
    };

    // ============================================================
    // HANDLE FACE RECOGNITION ERRORS
    // ============================================================
    // Called when face detection fails (camera error, no face, etc.)
    const handleFaceError = (err) => {
      setFaceRegistered(false);           // Face registration failed
      setFaceDataToSave(null);            // Clear any stored data
      setError(err);                      // Show error message to user
    };

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    const handleSubmit = async (e) => {
      e.preventDefault();  // Prevent page refresh on form submit
      setLoading(true);    // Disable button, show loading state
      setError('');        // Clear previous errors

      // ============================================================
      // VALIDATION CHECKS
      // ============================================================
      
      // Check 1: Passwords must match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;  // Stop execution
      }

      // Check 2: Password minimum length (security requirement)
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Check 3: If face recognition is enabled, face must be registered
      // This prevents users from enabling face login without capturing face
      if (enableFaceRecognition && (!faceRegistered || !faceDataToSave || !faceDataToSave.descriptor)) {
        setError('Please complete face registration before signing up. Make sure your face is clearly visible.');
        setLoading(false);
        return;
      }

      try {
        // ============================================================
        // PREPARE REQUEST DATA
        // ============================================================
        // Build the object sent to backend API
        const requestBody = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          enable2FA: enable2FA  // Send user's 2FA preference (true/false)
        };

        // ============================================================
        // STEP 1: CREATE CUSTOMER ACCOUNT
        // ============================================================
        // Sends signup request to backend
        const response = await fetch('http://localhost:5000/api/customers/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();  // Parse server response

        // ============================================================
        // STEP 2: HANDLE SUCCESSFUL SIGNUP
        // ============================================================
            if (response.ok) {
          
          // If face recognition was enabled, save the face data AFTER account creation
          if (enableFaceRecognition && faceDataToSave) {
            const faceSaveResponse = await fetch('http://localhost:5000/api/save-face-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: formData.email, 
                faceData: faceDataToSave
              })
            });
            
            if (!faceSaveResponse.ok) {
              console.warn('Face data not saved, but account was created');
            }
          }
          
          // Show success message
          alert('✅ Account created successfully! Please login.');
          
          // Redirect to login page
          navigate('/login');
        } else {
          // Server returned an error message
          setError(data.message || 'Signup failed');
        }
      } catch (err) {
        // Network error or server down
        console.error('Signup error:', err);
        setError('Network error. Please check your connection.');
      } finally {
        // Always re-enable the form (success or failure)
        setLoading(false);
      }
    };

    // ============================================================
    // RENDER SIGNUP FORM
    // ============================================================
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
          
          {/* ============================================================ */}
          {/* HEADER SECTION */}
          {/* ============================================================ */}
          <div className="text-center">
            {/* Logo/Brand icon */}
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join Smartify LB today
            </p>
          </div>

          {/* ============================================================ */}
          {/* SIGNUP FORM */}
          {/* ============================================================ */}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            
            {/* ---------------------------------------------------------- */}
            {/* NAME FIELDS - First & Last Name side by side */}
            {/* ---------------------------------------------------------- */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="First name"
                />
              </div>
              <div>
                <input
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* EMAIL FIELD */}
            {/* ---------------------------------------------------------- */}
            <div>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* PHONE FIELD - Optional */}
            {/* ---------------------------------------------------------- */}
            <div>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Phone number (optional)"
              />
            </div>

            {/* ============================================================ */}
            {/* FACE RECOGNITION OPTION */}
            {/* ============================================================ */}
            {/* Checkbox to enable/disable face login during signup */}
            {/* When checked, shows the FaceRecognition component */}
            {/* ============================================================ */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFaceRecognition}
                  onChange={(e) => setEnableFaceRecognition(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  📸 Enable Face Recognition Login
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-6">
                Register your face for faster login with camera
              </p>
              
              {/* Show camera component when checkbox is checked AND email is provided */}
              {enableFaceRecognition && !faceRegistered && formData.email && (
                <div className="mt-3 ml-6">
                  <FaceRecognition
                    email={formData.email}
                    mode="register"
                    onSuccess={(data) => handleFaceRegistered(data)}
                    onError={(err) => handleFaceError(err)}
                  />
                </div>
              )}
              
              {/* Warning: Email required before face registration */}
              {enableFaceRecognition && !faceRegistered && !formData.email && (
                <div className="mt-3 ml-6 text-yellow-600 text-sm">
                  ⚠️ Please enter your email above to register face
                </div>
              )}
              
              {/* Success message after face is captured */}
              {enableFaceRecognition && faceRegistered && (
                <div className="mt-3 ml-6 text-green-600 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Face registered successfully!
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* 2FA TOGGLE - ADDED SECTION */}
            {/* ============================================================ */}
            {/* Checkbox to enable/disable Two-Factor Authentication */}
            {/* ON by default for better security */}
            {/* When ON: User must enter email code to login */}
            {/* When OFF: User logs in with just password */}
            {/* ============================================================ */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  🔐 Enable Two-Factor Authentication (Recommended)
                </span>
              </label>
              {/* Dynamic description based on toggle state */}
              <p className="text-xs text-gray-500 mt-2 ml-6">
                {enable2FA 
                  ? "You'll receive a verification code via email when logging in" 
                  : "You can login with just your password"}
              </p>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* PASSWORD FIELD */}
            {/* ---------------------------------------------------------- */}
            <div>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password (min 6 characters)"
              />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* CONFIRM PASSWORD FIELD */}
            {/* ---------------------------------------------------------- */}
            <div>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* ERROR MESSAGE DISPLAY */}
            {/* ---------------------------------------------------------- */}
            {/* Only shown when there's an error */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* SUBMIT BUTTON */}
            {/* ---------------------------------------------------------- */}
            {/* Disabled while loading (prevents double submission) */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>

            {/* ---------------------------------------------------------- */}
            {/* LOGIN LINK */}
            {/* ---------------------------------------------------------- */}
            {/* Redirects existing users to login page */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* TERMS & PRIVACY */}
            {/* ---------------------------------------------------------- */}
            <div className="text-center text-xs text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default Signup;