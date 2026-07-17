// src/components/FaceIDAuth.js
// ============================================================
// FACE ID / BIOMETRIC AUTHENTICATION COMPONENT
// ============================================================
// Uses WebAuthn API for native biometric authentication:
// - Face ID on Apple devices (iPhone, iPad, Mac)
// - Windows Hello on Windows devices
// - Face Unlock on Android devices
// Falls back gracefully if biometrics are not supported
// ============================================================

import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaFingerprint, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

/**
 * FaceIDAuth Component
 * Provides biometric authentication using WebAuthn standard
 * 
 * @param {string} email - User's email for authentication
 * @param {function} onSuccess - Called when authentication succeeds (returns login data)
 * @param {function} onError - Called when authentication fails (returns error message)
 * @param {function} onRegister - Called when biometric registration completes
 * @param {string} buttonText - 'Register' for signup or text for login button
 */
const FaceIDAuth = ({ email, onSuccess, onError, onRegister, buttonText }) => {
  // Track if WebAuthn/biometrics are supported on this device/browser
  const [isSupported, setIsSupported] = useState(false);
  
  // Track if authentication/registration is in progress
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Name of biometric type (Face ID, Windows Hello, etc.)
  const [biometricType, setBiometricType] = useState('');
  
  // Whether the user has already registered biometrics
  const [hasFaceID, setHasFaceID] = useState(false);
  
  // Status/error/success message to display
  const [message, setMessage] = useState('');

  /**
   * Check biometric support and user's registration status on mount
   * Re-checks when email changes
   */
  useEffect(() => {
    checkSupport();        // Check if browser supports WebAuthn
    if (email) {
      checkUserFaceID();   // Check if user has biometrics registered
    }
  }, [email]);

  /**
   * Checks if the browser/device supports WebAuthn (biometric) authentication
   * Sets biometricType based on detected platform
   */
  const checkSupport = async () => {
    // Check if WebAuthn API is available in the browser
    if (window.PublicKeyCredential) {
      try {
        // Check if platform authenticator (biometric sensor) is available
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          setIsSupported(true);
          
          // Detect which type of biometric is available based on user agent
          const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
          const isWindows = /Windows/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);
          
          if (isMac) setBiometricType('Face ID');           // Apple devices
          else if (isWindows) setBiometricType('Windows Hello'); // Windows devices
          else if (isAndroid) setBiometricType('Face Unlock');   // Android devices
          else setBiometricType('Biometric');               // Fallback name
        } else {
          console.log('Platform authenticator not available');
        }
      } catch (error) {
        console.log('Face ID not supported:', error);
      }
    } else {
      console.log('WebAuthn not supported');
    }
  };

  /**
   * Checks if the current user has already registered biometric credentials
   * Calls backend endpoint to check face_id_enabled status
   */
  const checkUserFaceID = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/face-id/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setHasFaceID(data.hasFaceID);  // true if biometrics are registered
    } catch (error) {
      console.error('Check Face ID error:', error);
    }
  };

  /**
   * Converts a base64 string to an ArrayBuffer
   * WebAuthn API requires ArrayBuffer for challenge and credential IDs
   * @param {string} base64 - Base64 encoded string
   * @returns {ArrayBuffer} - Binary data as ArrayBuffer
   */
  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);  // Decode base64 to binary string
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);  // Convert each character to byte
    }
    return bytes.buffer;  // Return the underlying ArrayBuffer
  };

  /**
   * Converts an ArrayBuffer to a base64 string
   * Used to send binary WebAuthn data to the server as JSON
   * @param {ArrayBuffer} buffer - Binary data
   * @returns {string} - Base64 encoded string
   */
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);  // Convert ArrayBuffer to Uint8Array
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);  // Convert each byte to character
    }
    return btoa(binary);  // Encode binary string to base64
  };

  /**
   * REGISTRATION FLOW: Register biometric credentials using WebAuthn
   * 1. Gets challenge from server
   * 2. Creates credentials using native biometric prompt
   * 3. Sends credential to server for verification and storage
   */
  const registerFaceID = async () => {
    setIsAuthenticating(true);
    setMessage('');

    try {
      // ============================================================
      // STEP 1: Get registration challenge from server
      // Server generates a random challenge to prevent replay attacks
      // ============================================================
      const challengeResponse = await fetch('http://localhost:5000/api/webauthn/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const options = await challengeResponse.json();
      
      if (options.error) {
        throw new Error(options.error);
      }
      
      // ============================================================
      // STEP 2: Prepare WebAuthn credential creation options
      // This configures how the biometric prompt will behave
      // ============================================================
      const publicKeyCredentialCreationOptions = {
        challenge: base64ToArrayBuffer(options.challenge),  // Server challenge as ArrayBuffer
        rp: {
          name: options.rpName || "Smartify LB",            // Relying Party (your app name)
          id: options.rpId || window.location.hostname       // Domain for credential binding
        },
        user: {
          id: base64ToArrayBuffer(options.userId),           // Unique user identifier
          name: email,                                       // User's email as account name
          displayName: email                                 // Display name shown in biometric prompt
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256 algorithm (ECDSA with SHA-256)
          { alg: -257, type: "public-key" }  // RS256 algorithm (RSASSA-PKCS1-v1_5 with SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",  // Force use of built-in biometric (not external USB key)
          userVerification: "required",         // Require biometric verification (fingerprint/face)
          requireResidentKey: false             // Don't require resident key (discoverable credential)
        },
        timeout: 60000,      // 60 second timeout for user to complete biometric scan
        attestation: "none"   // Don't require attestation (privacy-preserving)
      };
      
      // ============================================================
      // STEP 3: Create credentials - TRIGGERS NATIVE BIOMETRIC PROMPT!
      // This is where the user sees Face ID / fingerprint scanner
      // The browser handles all the security - we just get the result
      // ============================================================
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      
      if (credential) {
        // ============================================================
        // STEP 4: Send credential data to server for storage
        // Server stores the public key and credential ID for future logins
        // ============================================================
        const registerResponse = await fetch('http://localhost:5000/api/webauthn/register-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            credentialId: arrayBufferToBase64(credential.rawId),                          // Unique credential ID
            publicKey: arrayBufferToBase64(credential.response.getPublicKey()),            // Public key for verification
            attestationObject: arrayBufferToBase64(credential.response.attestationObject), // Attestation data
            clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)        // Client data for verification
          })
        });
        
        const result = await registerResponse.json();
        
        if (result.success) {
          // Registration successful - show success message and update state
          setMessage({ type: 'success', text: `${biometricType} registered successfully!` });
          setHasFaceID(true);
          
          // Notify parent component after a short delay for UX
          setTimeout(() => {
            if (onRegister) onRegister({ success: true });
          }, 1000);
        } else {
          // Server rejected the registration
          setMessage({ type: 'error', text: result.message || 'Registration failed' });
          if (onError) onError(result.message);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Handle specific WebAuthn error types with user-friendly messages
      if (error.name === 'NotAllowedError') {
        // User cancelled the biometric prompt or it failed
        setMessage({ type: 'error', text: `${biometricType} verification cancelled or failed` });
      } else if (error.name === 'InvalidStateError') {
        // User already registered biometrics on this device
        setMessage({ type: 'error', text: 'Biometric already registered for this device' });
      } else {
        // Unknown error
        setMessage({ type: 'error', text: `Failed to register ${biometricType}: ${error.message}` });
      }
      if (onError) onError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * AUTHENTICATION FLOW: Verify user identity using registered biometrics
   * 1. Gets login challenge from server
   * 2. Gets credential assertion using native biometric prompt
   * 3. Sends assertion to server for verification
   * 4. On success, completes login and gets JWT token
   */
  const authenticateWithFaceID = async () => {
    setIsAuthenticating(true);
    setMessage('');

    try {
      // ============================================================
      // STEP 1: Get login challenge from server
      // Server returns the challenge and list of allowed credentials
      // ============================================================
      const challengeResponse = await fetch('http://localhost:5000/api/webauthn/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const options = await challengeResponse.json();
      
      if (options.error) {
        throw new Error(options.error);
      }
      
      // Check if user has any registered credentials
      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        setMessage({ type: 'error', text: 'No biometrics registered for this account' });
        setIsAuthenticating(false);
        return;
      }
      
      // ============================================================
      // STEP 2: Prepare credential request options
      // Specifies which credentials are allowed for this user
      // ============================================================
      const publicKeyCredentialRequestOptions = {
        challenge: base64ToArrayBuffer(options.challenge),  // Server challenge
        rpId: options.rpId || window.location.hostname,     // Must match registration rpId
        allowCredentials: options.allowCredentials.map(cred => ({
          id: base64ToArrayBuffer(cred.id),   // Credential ID as ArrayBuffer
          type: cred.type,                     // "public-key"
          transports: cred.transports || ["internal"]  // How to communicate with authenticator
        })),
        userVerification: "required",  // Require biometric verification
        timeout: 60000                  // 60 second timeout
      };
      
      // ============================================================
      // STEP 3: Get assertion - TRIGGERS NATIVE BIOMETRIC PROMPT!
      // User must scan their face/fingerprint to proceed
      // ============================================================
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });
      
      if (assertion) {
        // ============================================================
        // STEP 4: Send assertion to server for verification
        // Server verifies the signature using the stored public key
        // ============================================================
        const verifyResponse = await fetch('http://localhost:5000/api/webauthn/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            credentialId: arrayBufferToBase64(assertion.rawId),                      // Credential ID
            authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData), // Auth data
            clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),       // Client data
            signature: arrayBufferToBase64(assertion.response.signature)                  // Cryptographic signature
          })
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          // Biometric verification succeeded on server
          setMessage({ type: 'success', text: `${biometricType} verified! Logging in...` });
          
          // ============================================================
          // STEP 5: Complete login - get JWT token for session
          // This is the final step that creates the user's session
          // ============================================================
          const loginResponse = await fetch('http://localhost:5000/api/face-id/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: email, 
              faceIdVerified: true   // Flag indicating biometric was verified
            })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok && loginData.success) {
            // Login complete - notify parent with user data and token
            setTimeout(() => {
              if (onSuccess) onSuccess(loginData);
            }, 500);
          } else {
            setMessage({ type: 'error', text: loginData.message || 'Login failed' });
            if (onError) onError(loginData.message);
          }
        } else {
          // Server rejected the biometric assertion
          setMessage({ type: 'error', text: result.message || 'Authentication failed' });
          if (onError) onError(result.message);
        }
      }
    } catch (error) {
      console.error('Face ID error:', error);
      // Handle specific WebAuthn error types
      if (error.name === 'NotAllowedError') {
        // User cancelled or biometric scan failed
        setMessage({ type: 'error', text: `${biometricType} verification cancelled` });
      } else if (error.name === 'InvalidStateError') {
        // No credentials registered for this site
        setMessage({ type: 'error', text: 'No biometrics registered. Please register first.' });
      } else {
        setMessage({ type: 'error', text: `${biometricType} authentication failed: ${error.message}` });
      }
      if (onError) onError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ============================================================
  // RENDER: Biometrics not supported message
  // Shows when browser/device doesn't have biometric capabilities
  // ============================================================
  if (!isSupported) {
    return (
      <div className="faceid-container">
        <div className="faceid-unsupported">
          <FaUserCircle size={32} />
          <p>Biometric authentication not supported on this device/browser</p>
          <p className="hint">Please use email verification instead</p>
        </div>
        <style>{`
          .faceid-unsupported {
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 12px;
            color: #666;
          }
          .faceid-unsupported p {
            margin: 10px 0;
          }
          .hint {
            font-size: 0.8rem;
            color: #999;
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER: Main biometric authentication interface
  // Shows register or login button based on buttonText prop
  // ============================================================
  return (
    <div className="faceid-container">
      {/* Show success/error messages with appropriate icons */}
      {message && (
        <div className={`faceid-message ${message.type}`}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{message.text}</span>
        </div>
      )}
      
      {/* Main action button - changes behavior based on buttonText */}
      <button
        onClick={buttonText === 'Register' ? registerFaceID : authenticateWithFaceID}
        disabled={isAuthenticating || (buttonText !== 'Register' && !hasFaceID)}  // Disable if authenticating or no biometrics registered
        className="faceid-button"
      >
        {isAuthenticating ? (
          <FaSpinner className="spin" />  // Show spinning loader during authentication
        ) : (
          <>
            {/* Show appropriate icon based on biometric type */}
            {biometricType === 'Face ID' ? <FaUserCircle size={20} /> : <FaFingerprint size={20} />}
            <span>
              {buttonText === 'Register' 
                ? `Register ${biometricType}`     // Registration button text
                : `Login with ${biometricType}`}  // Login button text
            </span>
          </>
        )}
      </button>

      {/* Show registration hint if user hasn't registered biometrics yet */}
      {buttonText !== 'Register' && !hasFaceID && (
        <p className="faceid-hint">
          No {biometricType} registered. <button onClick={registerFaceID} className="link-btn">Register now</button>
        </p>
      )}

      {/* Component styles */}
      <style>{`
        .faceid-container {
          margin: 15px 0;
        }
        
        .faceid-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }
        
        .faceid-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .faceid-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .faceid-message {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }
        
        .faceid-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .faceid-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .faceid-hint {
          text-align: center;
          font-size: 0.8rem;
          color: #666;
          margin-top: 8px;
        }
        
        .link-btn {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          text-decoration: underline;
          font-size: 0.8rem;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FaceIDAuth;