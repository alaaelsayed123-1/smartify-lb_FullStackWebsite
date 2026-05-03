import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FaceIDAuth from '../components/FaceIDAuth';
import Verify2FA from '../components/Verify2FA';
import FaceRecognition from '../components/FaceRecognition';
import { FaEnvelope, FaLock, FaSpinner, FaUserCircle, FaCamera } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FAMethods, setShow2FAMethods] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [hasFaceID, setHasFaceID] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        login(data.customer, data.token);
        navigate('/');
      } else if (response.status === 202 && data.requires2FA) {
        const faceIDCheck = await fetch('http://localhost:5000/api/face-id/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const faceIDData = await faceIDCheck.json();
        
        const faceDataCheck = await fetch('http://localhost:5000/api/check-face-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const faceDataResult = await faceDataCheck.json();
        
        setHasFaceID(faceIDData.hasFaceID);
        setHasFaceData(faceDataResult.hasFaceData);
        setCustomerData(data);
        setShow2FAMethods(true);
        setError('');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = (customer, token) => {
    login(customer, token);
    navigate('/');
  };

  const handleFaceSuccess = async (verified) => {
    if (verified) {
      const response = await fetch('http://localhost:5000/api/face-id/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, faceIdVerified: true })
      });
      const data = await response.json();
      if (data.success) {
        handle2FASuccess(data.customer, data.token);
      }
    }
  };

  if (show2FAMethods && !selectedMethod) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Two-Factor Authentication</h2>
          <p className="subtitle">Choose how to verify your identity</p>
          
          {hasFaceData && (
            <button
              onClick={() => setSelectedMethod('camera')}
              className="auth-method-btn camera"
            >
              <FaCamera className="method-icon" />
              <div className="method-info">
                <h3>Face Recognition</h3>
                <p>Use camera to verify your face</p>
              </div>
              <span className="arrow">→</span>
            </button>
          )}
          
          {hasFaceID && (
            <button
              onClick={() => setSelectedMethod('faceid')}
              className="auth-method-btn faceid"
            >
              <FaUserCircle className="method-icon" />
              <div className="method-info">
                <h3>Windows Hello / Face ID</h3>
                <p>Use device biometrics</p>
              </div>
              <span className="arrow">→</span>
            </button>
          )}
          
          <button
            onClick={() => setSelectedMethod('email')}
            className="auth-method-btn email"
          >
            <FaEnvelope className="method-icon" />
            <div className="method-info">
              <h3>Email Verification Code</h3>
              <p>Receive 6-digit code via email</p>
            </div>
            <span className="arrow">→</span>
          </button>
          
          <button onClick={() => {
            setShow2FAMethods(false);
            setSelectedMethod(null);
            setCustomerData(null);
            setPassword('');
          }} className="back-btn">
            ← Back to Login
          </button>
        </div>
        
        <style>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .login-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
            border-color: #667eea;
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
          }
          .method-icon {
            font-size: 32px;
          }
          .auth-method-btn.camera .method-icon { color: #28a745; }
          .auth-method-btn.faceid .method-icon { color: #667eea; }
          .auth-method-btn.email .method-icon { color: #f5576c; }
          .method-info {
            flex: 1;
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
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 0.9rem;
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (selectedMethod === 'faceid') {
    return (
      <div className="login-container">
        <div className="login-card">
          <FaceIDAuth
            email={email}
            onSuccess={(data) => handle2FASuccess(data.customer, data.token)}
            onError={(err) => setError(err)}
            buttonText="Login"
          />
          <button onClick={() => setSelectedMethod(null)} className="back-btn">
            ← Other verification methods
          </button>
          {error && <div className="error-message mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  if (selectedMethod === 'camera') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Face Verification</h2>
          <FaceRecognition
            email={email}
            mode="login"
            onSuccess={handleFaceSuccess}
            onError={(err) => setError(err)}
            onCancel={() => setSelectedMethod(null)}
          />
          <button onClick={() => setSelectedMethod(null)} className="back-btn">
            ← Back to verification methods
          </button>
          {error && <div className="error-message mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  if (selectedMethod === 'email') {
    return (
      <Verify2FA
        email={email}
        customerId={customerData?.customerId}
        onSuccess={handle2FASuccess}
        onCancel={() => {
          setSelectedMethod(null);
          setShow2FAMethods(true);
        }}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Login to your Smartify account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
            Forgot password?
          </a>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </a>
        </div>
      </div>
      
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .login-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .input-group {
          position: relative;
          margin-bottom: 20px;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        .input-group input {
          width: 100%;
          padding: 14px 15px 14px 45px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          gap: 10px;
        }
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 0.9rem;
        }
        .animate-spin {
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

export default LoginPage;