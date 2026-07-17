// ============================================================
// SMARTIFY LB - 2FA VERIFICATION COMPONENT
// ============================================================
// This component handles the Two-Factor Authentication (2FA) step
// It appears as a modal overlay when a user tries to login
// User must enter the 6-digit code sent to their email
// On success, stores the JWT token and redirects to the app
// ============================================================

// ============================================================
// IMPORT REACT AND USESTATE HOOK
// ============================================================
// useState - manages component state (code input, loading, errors)
// This is a functional component (not class-based)
// ============================================================
import React, { useState } from 'react';

// ============================================================
// COMPONENT: Verify2FA
// ============================================================
// Props received from parent:
//   - email: The user's email address (to send code and display)
//   - customerId: The customer's database ID
//   - onSuccess: Callback function when verification succeeds
//   - onCancel: Callback function when user cancels verification
// ============================================================
const Verify2FA = ({ email, customerId, onSuccess, onCancel }) => {
  
  // ============================================================
  // STATE: Verification Code Input
  // ============================================================
  // Stores the 6-digit code as the user types it
  // Initially empty string
  // Only accepts digits (non-digits are filtered out)
  // Maximum 6 characters
  // ============================================================
  const [code, setCode] = useState('');
  
  // ============================================================
  // STATE: Loading Indicator
  // ============================================================
  // true = showing loading spinner on Verify button
  // false = showing normal "Verify & Login" text
  // Set to true while waiting for API response
  // ============================================================
  const [loading, setLoading] = useState(false);
  
  // ============================================================
  // STATE: Error Message
  // ============================================================
  // Stores error message to display to user
  // Empty string = no error (error box hidden)
  // Examples: "Invalid code", "Network error", etc.
  // ============================================================
  const [error, setError] = useState('');
  
  // ============================================================
  // STATE: Resend Button Loading
  // ============================================================
  // true = showing "Sending..." on Resend button
  // false = showing normal "Resend Code" text
  // Prevents double-clicking the resend button
  // ============================================================
  const [resendLoading, setResendLoading] = useState(false);

  // ============================================================
  // HANDLER: Verify the 6-Digit Code
  // ============================================================
  // This function runs when the user clicks "Verify & Login"
  // It sends the code to the backend for validation
  // On success: stores token and customer data, calls onSuccess
  // On failure: displays error message
  // ============================================================
  const handleVerify = async () => {
    // ============================================================
    // VALIDATION: Check code is exactly 6 digits
    // ============================================================
    // Prevents API call with invalid code length
    // Shows error message immediately (no server call needed)
    // ============================================================
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;  // Stop execution, don't call API
    }
    
    // ============================================================
    // SET LOADING STATE
    // ============================================================
    // Show loading spinner on button
    // Clear any previous error messages
    // ============================================================
    setLoading(true);
    setError('');
    
    try {
      // ============================================================
      // API CALL: Verify the code with backend
      // ============================================================
      // POST request to /api/verify-email-code
      // Sends the email and the 6-digit code
      // Backend checks if code is valid and not expired
      // ============================================================
      const response = await fetch('http://localhost:5000/api/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },  // JSON data format
        body: JSON.stringify({ 
          email,  // User's email (to find their verification record)
          code    // The 6-digit code they entered
        })
      });
      
      // ============================================================
      // PARSE RESPONSE
      // ============================================================
      // Convert JSON response to JavaScript object
      // Response contains: success, token, customer (if valid)
      // ============================================================
      const data = await response.json();
      
      // ============================================================
      // HANDLE SUCCESSFUL VERIFICATION
      // ============================================================
      // Check three conditions:
      //   1. data.success is true
      //   2. data.token exists (JWT for authentication)
      //   3. data.customer exists (user profile data)
      // ============================================================
      if (data.success && data.token && data.customer) {
        // ============================================================
        // STORE AUTHENTICATION DATA IN LOCAL STORAGE
        // ============================================================
        // localStorage persists data even after browser close
        // 'token' - JWT string for authenticated API requests
        // 'customer' - User profile as JSON string
        // This is how the app remembers the user is logged in
        // ============================================================
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customer));
        
        // ============================================================
        // CALL THE SUCCESS CALLBACK
        // ============================================================
        // Notifies the parent component that login is complete
        // Passes customer data and token for context update
        // Parent typically redirects to home page or dashboard
        // ============================================================
        if (onSuccess) {
          onSuccess(data.customer, data.token);
        }
      } else {
        // ============================================================
        // HANDLE FAILED VERIFICATION
        // ============================================================
        // Backend returned success: false
        // Display the error message from backend
        // Common reasons: wrong code, expired code
        // Fallback message if no message provided
        // ============================================================
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      // ============================================================
      // HANDLE NETWORK/PROGRAMMING ERRORS
      // ============================================================
      // This catches errors like:
      //   - Server is down (no response)
      //   - Network connection lost
      //   - JSON parsing failed
      // Log the full error for debugging
      // Show friendly message to user
      // ============================================================
      console.error('Verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      // ============================================================
      // RESET LOADING STATE
      // ============================================================
      // Runs whether verification succeeded or failed
      // Hides the loading spinner
      // Re-enables the button
      // ============================================================
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLER: Resend Verification Code
  // ============================================================
  // This function runs when user clicks "Resend Code"
  // Requests a new 6-digit code be sent to their email
  // Useful if the first code expired or wasn't received
  // ============================================================
  const handleResend = async () => {
    // ============================================================
    // SET RESEND LOADING STATE
    // ============================================================
    // Show "Sending..." on the resend button
    // Clear any previous error messages
    // ============================================================
    setResendLoading(true);
    setError('');
    
    try {
      // ============================================================
      // API CALL: Request new verification code
      // ============================================================
      // POST request to /api/resend-2fa-code
      // Sends the email address
      // Backend generates new code and emails it
      // Invalidates any previous unused codes
      // ============================================================
      const response = await fetch('http://localhost:5000/api/resend-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })  // Only need email to resend
      });
      
      // ============================================================
      // PARSE RESPONSE
      // ============================================================
      const data = await response.json();
      
      // ============================================================
      // HANDLE SUCCESSFUL RESEND
      // ============================================================
      // Check if HTTP response was OK (status 200-299)
      // Show success alert to user
      // They should check their email for the new code
      // ============================================================
      if (response.ok) {
        alert('New verification code sent to your email!');
      } else {
        // ============================================================
        // HANDLE FAILED RESEND
        // ============================================================
        // Backend returned an error
        // Display the error message
        // Common reasons: email not found, server error
        // ============================================================
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      // ============================================================
      // HANDLE NETWORK ERRORS
      // ============================================================
      console.error('Resend error:', err);
      setError('Network error. Please try again.');
    } finally {
      // ============================================================
      // RESET RESEND LOADING STATE
      // ============================================================
      // Runs whether resend succeeded or failed
      // Hides "Sending..." text
      // Re-enables the resend button
      // ============================================================
      setResendLoading(false);
    }
  };

  // ============================================================
  // RENDER: 2FA VERIFICATION MODAL
  // ============================================================
  // Returns the complete modal overlay UI
  // Structure: Overlay → Card → Icon + Title + Input + Buttons
  // ============================================================
  return (
    // ============================================================
    // MODAL OVERLAY
    // ============================================================
    // Covers the entire screen with semi-transparent black
    // Centers the verification card both horizontally and vertically
    // z-50 ensures it appears above all other content
    // p-4 adds padding for small screens (prevents edge touching)
    // ============================================================
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      
      {/* ============================================================ */}
      {/* VERIFICATION CARD */}
      {/* ============================================================ */}
      {/* White card with rounded corners and shadow */}
      {/* max-w-md = maximum width for readability */}
      {/* w-full = full width on small screens */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        
        {/* ============================================================ */}
        {/* HEADER SECTION */}
        {/* ============================================================ */}
        {/* Centered content with icon, title, and instruction text */}
        {/* ============================================================ */}
        <div className="text-center mb-6">
          
          {/* ============================================================ */}
          {/* LOCK ICON */}
          {/* ============================================================ */}
          {/* Blue circle with a lock SVG icon inside */}
          {/* Visually communicates "security/verification" */}
          {/* ============================================================ */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* SVG Lock Icon */}
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          {/* ============================================================ */}
          {/* TITLE AND INSTRUCTIONS */}
          {/* ============================================================ */}
          {/* Bold heading telling user what to do */}
          {/* Shows the email where the code was sent */}
          {/* ============================================================ */}
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Login</h2>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold text-blue-600">{email}</span>  {/* User's email in blue */}
          </p>
        </div>
        
        {/* ============================================================ */}
        {/* CODE INPUT FIELD */}
        {/* ============================================================ */}
        {/* Large centered input for the 6-digit code */}
        {/* Uses monospace font for even character spacing */}
        {/* letter-spacing makes digits easier to read */}
        {/* Auto-focused so user can type immediately */}
        {/* Only accepts digits, max 6 characters */}
        {/* ============================================================ */}
        <input
          type="text"                    // Text type (not number, to avoid spinner arrows)
          placeholder="000000"           // Shows 6 zeros as placeholder
          value={code}                   // Controlled by state
          onChange={(e) => {
            // ============================================================
            // INPUT FILTERING
            // ============================================================
            // replace(/\D/g, '') removes all non-digit characters
            // slice(0, 6) limits to maximum 6 characters
            // This ensures only numbers 0-9 are accepted
            // ============================================================
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);  // Update state with cleaned value
          }}
          // Styling classes:
          // w-full = full width
          // p-4 = generous padding
          // text-center = centered text
          // text-2xl = large font size
          // tracking-widest = wide letter spacing for readability
          // font-mono = monospace font (each digit same width)
          className="w-full p-4 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus  // Automatically focus this input when modal opens
        />
        
        {/* ============================================================ */}
        {/* ERROR MESSAGE */}
        {/* ============================================================ */}
        {/* Only shown when there's an error (error state is not empty) */}
        {/* Red background with red border and red text */}
        {/* ============================================================ */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
        
        {/* ============================================================ */}
        {/* VERIFY BUTTON */}
        {/* ============================================================ */}
        {/* Main action button - submits the code for verification */}
        {/* Gradient background (blue to purple) */}
        {/* Disabled when: loading OR code length is not 6 */}
        {/* Shows spinner when loading, "Verify & Login" when ready */}
        {/* ============================================================ */}
        <button
          onClick={handleVerify}  // Trigger verification
          disabled={loading || code.length !== 6}  // Prevent invalid submissions
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* ============================================================ */}
          {/* BUTTON CONTENT: Loading vs Normal */}
          {/* ============================================================ */}
          {loading ? (
            // LOADING STATE: Spinner + "Verifying..."
            <span className="flex items-center justify-center gap-2">
              {/* Animated spinner SVG */}
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            // NORMAL STATE: Just text
            'Verify & Login'
          )}
        </button>
        
        {/* ============================================================ */}
        {/* RESEND CODE BUTTON */}
        {/* ============================================================ */}
        {/* Secondary action - requests a new code */}
        {/* Blue text, no background (subtle appearance) */}
        {/* Disabled while resend is in progress */}
        {/* Shows "Sending..." when loading */}
        {/* ============================================================ */}
        <button
          onClick={handleResend}  // Trigger code resend
          disabled={resendLoading}  // Prevent double-clicking
          className="w-full mt-3 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          {resendLoading ? 'Sending...' : 'Resend Code'}
        </button>
        
        {/* ============================================================ */}
        {/* CANCEL BUTTON */}
        {/* ============================================================ */}
        {/* Only shown if onCancel callback is provided */}
        {/* Allows user to go back to login page */}
        {/* Gray text, subtle appearance */}
        {/* ============================================================ */}
        {onCancel && (
          <button
            onClick={onCancel}  // Call the cancel callback
            className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        
      </div>
    </div>
  );
};

// ============================================================
// EXPORT THE COMPONENT
// ============================================================
// Makes Verify2FA available for import in other files
// Used in the login flow when 2FA is enabled
// ============================================================
export default Verify2FA;