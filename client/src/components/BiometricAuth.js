// src/components/BiometricAuth.js
import React, { useState, useEffect } from 'react';
import { FaFingerprint, FaFaceSmile, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';

const BiometricAuth = ({ onSuccess, onError, email, className }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  // Check if biometric authentication is supported
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    // Check for WebAuthn support (Face ID, Touch ID, Windows Hello)
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          setIsSupported(true);
          
          // Detect biometric type
          if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            // Try to detect if it's Face ID capable (macOS/iOS)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
            if (isMac || isIPhone) {
              setBiometricType('Face ID');
            } else if (/Windows/.test(navigator.userAgent)) {
              setBiometricType('Windows Hello');
            } else if (/Android/.test(navigator.userAgent)) {
              setBiometricType('Face Unlock / Fingerprint');
            } else {
              setBiometricType('Biometric');
            }
          }
        }
      } catch (error) {
        console.log('Biometric not supported:', error);
      }
    }
  };

  // Generate random challenge
  const generateChallenge = () => {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    return challenge;
  };

  // Create credential for biometric registration
  const registerBiometric = async (userId, userName, userEmail) => {
    if (!isSupported) {
      onError?.('Biometric authentication is not supported on this device');
      return false;
    }

    try {
      const challenge = generateChallenge();
      
      const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "Smartify Store",
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userName
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },  // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      // Store credential info in localStorage (for demo purposes)
      const biometricData = {
        credentialId: Array.from(new Uint8Array(credential.rawId)),
        userId: userId,
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem(`biometric_${userId}`, JSON.stringify(biometricData));
      
      onSuccess?.('Biometric authentication enabled successfully!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      onError?.(error.message || 'Failed to register biometric');
      return false;
    }
  };

  // Authenticate with biometric
  const authenticateWithBiometric = async (userId) => {
    if (!isSupported) {
      onError?.('Biometric authentication is not supported');
      return false;
    }

    setIsAuthenticating(true);

    try {
      // Get stored biometric data
      const storedData = localStorage.getItem(`biometric_${userId}`);
      if (!storedData) {
        onError?.('Biometric not set up for this account');
        setIsAuthenticating(false);
        return false;
      }

      const biometricInfo = JSON.parse(storedData);
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
          id: new Uint8Array(biometricInfo.credentialId),
          type: "public-key",
          transports: ["internal"]
        }],
        timeout: 60000,
        userVerification: "required"
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        onSuccess?.('Biometric authentication successful!');
        setIsAuthenticating(false);
        return true;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      onError?.(error.message || 'Biometric authentication failed');
      setIsAuthenticating(false);
      return false;
    }

    setIsAuthenticating(false);
    return false;
  };

  // Check if user has biometric enabled
  const isBiometricEnabled = (userId) => {
    return localStorage.getItem(`biometric_${userId}`) !== null;
  };

  // Remove biometric for user
  const removeBiometric = (userId) => {
    localStorage.removeItem(`biometric_${userId}`);
    onSuccess?.('Biometric authentication disabled');
  };

  return (
    <div className={`biometric-auth ${className || ''}`}>
      {isSupported && (
        <div className="biometric-container">
          <div className="biometric-info">
            <FaShieldAlt className="biometric-icon" />
            <h3>Quick Login with {biometricType}</h3>
            <p>Use your {biometricType} for faster, more secure access</p>
          </div>
          
          {email && (
            <button
              onClick={() => {
                const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
                authenticateWithBiometric(userId);
              }}
              disabled={isAuthenticating}
              className="biometric-button"
            >
              {isAuthenticating ? (
                <div className="biometric-spinner"></div>
              ) : (
                <>
                  {biometricType === 'Face ID' ? (
                    <FaFaceSmile />
                  ) : (
                    <FaFingerprint />
                  )}
                  <span>Login with {biometricType}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      <style jsx>{`
        .biometric-auth {
          margin: 20px 0;
        }
        
        .biometric-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          color: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .biometric-info {
          margin-bottom: 20px;
        }
        
        .biometric-icon {
          font-size: 48px;
          margin-bottom: 10px;
          animation: pulse 2s infinite;
        }
        
        .biometric-info h3 {
          margin: 10px 0;
          font-size: 1.3rem;
        }
        
        .biometric-info p {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .biometric-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
          width: auto;
          margin: 0 auto;
        }
        
        .biometric-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .biometric-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .biometric-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #667eea;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .biometric-container {
            padding: 15px;
          }
          
          .biometric-button {
            padding: 10px 20px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BiometricAuth;