// src/components/FaceIDAuth.js
import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaFingerprint, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const FaceIDAuth = ({ email, onSuccess, onError, onRegister, buttonText }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [hasFaceID, setHasFaceID] = useState(false);
  const [message, setMessage] = useState('');

  // Check if Face ID is supported
  useEffect(() => {
    checkSupport();
    if (email) {
      checkUserFaceID();
    }
  }, [email]);

  const checkSupport = async () => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          setIsSupported(true);
          
          // Detect biometric type
          const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
          const isWindows = /Windows/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);
          
          if (isMac) setBiometricType('Face ID');
          else if (isWindows) setBiometricType('Windows Hello');
          else if (isAndroid) setBiometricType('Face Unlock');
          else setBiometricType('Biometric');
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

  const checkUserFaceID = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/face-id/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setHasFaceID(data.hasFaceID);
    } catch (error) {
      console.error('Check Face ID error:', error);
    }
  };

  // Convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // REAL WebAuthn Registration
  const registerFaceID = async () => {
    setIsAuthenticating(true);
    setMessage('');

    try {
      // Step 1: Get registration challenge from server
      const challengeResponse = await fetch('http://localhost:5000/api/webauthn/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const options = await challengeResponse.json();
      
      if (options.error) {
        throw new Error(options.error);
      }
      
      // Prepare the credential creation options
      const publicKeyCredentialCreationOptions = {
        challenge: base64ToArrayBuffer(options.challenge),
        rp: {
          name: options.rpName || "Smartify LB",
          id: options.rpId || window.location.hostname
        },
        user: {
          id: base64ToArrayBuffer(options.userId),
          name: email,
          displayName: email
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",  // Force built-in biometric
          userVerification: "required",
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "none"
      };
      
      // Step 2: Create credentials (triggers native biometric prompt!)
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      
      if (credential) {
        // Step 3: Send credential to server for verification
        const registerResponse = await fetch('http://localhost:5000/api/webauthn/register-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            credentialId: arrayBufferToBase64(credential.rawId),
            publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
            attestationObject: arrayBufferToBase64(credential.response.attestationObject),
            clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
          })
        });
        
        const result = await registerResponse.json();
        
        if (result.success) {
          setMessage({ type: 'success', text: `${biometricType} registered successfully!` });
          setHasFaceID(true);
          
          // Also update local storage or state
          setTimeout(() => {
            if (onRegister) onRegister({ success: true });
          }, 1000);
        } else {
          setMessage({ type: 'error', text: result.message || 'Registration failed' });
          if (onError) onError(result.message);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'NotAllowedError') {
        setMessage({ type: 'error', text: `${biometricType} verification cancelled or failed` });
      } else if (error.name === 'InvalidStateError') {
        setMessage({ type: 'error', text: 'Biometric already registered for this device' });
      } else {
        setMessage({ type: 'error', text: `Failed to register ${biometricType}: ${error.message}` });
      }
      if (onError) onError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // REAL WebAuthn Authentication
  const authenticateWithFaceID = async () => {
    setIsAuthenticating(true);
    setMessage('');

    try {
      // Step 1: Get login challenge from server
      const challengeResponse = await fetch('http://localhost:5000/api/webauthn/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const options = await challengeResponse.json();
      
      if (options.error) {
        throw new Error(options.error);
      }
      
      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        setMessage({ type: 'error', text: 'No biometrics registered for this account' });
        setIsAuthenticating(false);
        return;
      }
      
      // Prepare the credential request options
      const publicKeyCredentialRequestOptions = {
        challenge: base64ToArrayBuffer(options.challenge),
        rpId: options.rpId || window.location.hostname,
        allowCredentials: options.allowCredentials.map(cred => ({
          id: base64ToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports || ["internal"]
        })),
        userVerification: "required",
        timeout: 60000
      };
      
      // Step 2: Get assertion (triggers native biometric prompt!)
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });
      
      if (assertion) {
        // Step 3: Send assertion to server for verification
        const verifyResponse = await fetch('http://localhost:5000/api/webauthn/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            credentialId: arrayBufferToBase64(assertion.rawId),
            authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
            clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
            signature: arrayBufferToBase64(assertion.response.signature)
          })
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          setMessage({ type: 'success', text: `${biometricType} verified! Logging in...` });
          
          // Call backend to complete login and get JWT token
          const loginResponse = await fetch('http://localhost:5000/api/face-id/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: email, 
              faceIdVerified: true 
            })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok && loginData.success) {
            setTimeout(() => {
              if (onSuccess) onSuccess(loginData);
            }, 500);
          } else {
            setMessage({ type: 'error', text: loginData.message || 'Login failed' });
            if (onError) onError(loginData.message);
          }
        } else {
          setMessage({ type: 'error', text: result.message || 'Authentication failed' });
          if (onError) onError(result.message);
        }
      }
    } catch (error) {
      console.error('Face ID error:', error);
      if (error.name === 'NotAllowedError') {
        setMessage({ type: 'error', text: `${biometricType} verification cancelled` });
      } else if (error.name === 'InvalidStateError') {
        setMessage({ type: 'error', text: 'No biometrics registered. Please register first.' });
      } else {
        setMessage({ type: 'error', text: `${biometricType} authentication failed: ${error.message}` });
      }
      if (onError) onError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

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

  return (
    <div className="faceid-container">
      {message && (
        <div className={`faceid-message ${message.type}`}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{message.text}</span>
        </div>
      )}
      
      <button
        onClick={buttonText === 'Register' ? registerFaceID : authenticateWithFaceID}
        disabled={isAuthenticating || (buttonText !== 'Register' && !hasFaceID)}
        className="faceid-button"
      >
        {isAuthenticating ? (
          <FaSpinner className="spin" />
        ) : (
          <>
            {biometricType === 'Face ID' ? <FaUserCircle size={20} /> : <FaFingerprint size={20} />}
            <span>
              {buttonText === 'Register' 
                ? `Register ${biometricType}` 
                : `Login with ${biometricType}`}
            </span>
          </>
        )}
      </button>

      {buttonText !== 'Register' && !hasFaceID && (
        <p className="faceid-hint">
          No {biometricType} registered. <button onClick={registerFaceID} className="link-btn">Register now</button>
        </p>
      )}

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