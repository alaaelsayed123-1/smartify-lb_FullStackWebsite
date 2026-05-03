// src/components/ProfileBiometricSetup.js
import React, { useState, useEffect } from 'react';
import BiometricAuth from './BiometricAuth';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ProfileBiometricSetup = ({ userEmail, userName, userId }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if biometric is already set up
    const stored = localStorage.getItem(`biometric_${userId}`);
    setBiometricEnabled(!!stored);
  }, [userId]);

  const handleSuccess = (msg) => {
    setMessage({ text: msg, type: 'success' });
    setBiometricEnabled(true);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleError = (error) => {
    setMessage({ text: error, type: 'error' });
    setTimeout(() => setMessage(null), 3000);
  };

  const disableBiometric = () => {
    localStorage.removeItem(`biometric_${userId}`);
    setBiometricEnabled(false);
    setMessage({ text: 'Biometric disabled successfully', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="profile-biometric">
      <h3>🔐 Biometric Authentication</h3>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {message.text}
        </div>
      )}
      
      {!biometricEnabled ? (
        <div className="setup-section">
          <p>Enable Face ID, Fingerprint, or Windows Hello for faster login</p>
          <BiometricAuth
            email={userEmail}
            onSuccess={handleSuccess}
            onError={handleError}
          />
          <button 
            className="setup-button"
            onClick={() => {
              const auth = document.querySelector('.biometric-button');
              if (auth) auth.click();
            }}
          >
            Enable Biometric Login
          </button>
        </div>
      ) : (
        <div className="enabled-section">
          <div className="enabled-badge">
            <FaCheckCircle />
            <span>Biometric Login Enabled</span>
          </div>
          <button onClick={disableBiometric} className="disable-button">
            Disable Biometric Login
          </button>
        </div>
      )}
      
      <style>{`
        .profile-biometric {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .profile-biometric h3 {
          margin-bottom: 15px;
          color: #333;
        }
        
        .message {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
        }
        
        .setup-button, .disable-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .disable-button {
          background: #dc3545;
        }
        
        .enabled-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default ProfileBiometricSetup;