import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

/**
 * FaceRecognition Component
 * Handles face registration and verification using face-api.js
 * @param {string} email - User's email for identification
 * @param {function} onSuccess - Callback when face is successfully registered/verified
 * @param {function} onError - Callback for error handling (used for model loading errors only)
 * @param {string} mode - 'register' for signup or 'verify' for login
 * @param {function} onCancel - Callback to cancel face recognition
 */
const FaceRecognition = ({ email, onSuccess, onError, mode, onCancel }) => {
  // Reference to the webcam component for capturing images
  const webcamRef = useRef(null);
  
  // State to track if face detection models are loaded
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // State to track if scanning is in progress (disables button)
  const [scanning, setScanning] = useState(false);
  
  // State for displaying status messages to user
  const [message, setMessage] = useState('');
  
  // State to store the captured face data (descriptor + image)
  const [capturedFace, setCapturedFace] = useState(null);

  // Load face detection models when component mounts
  useEffect(() => {
    loadModels();
  }, []);

  /**
   * Loads face-api.js models from the /public/models directory
   * Models required: tinyFaceDetector, faceLandmark68Net, faceRecognitionNet
   */
  const loadModels = async () => {
    try {
      console.log('Loading face detection models...');
      // Load all three required models for face detection and recognition
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setModelsLoaded(true);
      console.log('✅ Face models loaded successfully');
      setMessage('✅ Camera ready! Look at the camera');
    } catch (error) {
      console.error('Error loading models:', error);
      setMessage('Error loading face recognition. Please refresh the page.');
      // Only call onError for critical model loading failures
      if (onError) onError('Failed to load face models');
    }
  };

  /**
   * Captures face from webcam and extracts face descriptor for registration
   * Called when user clicks "Register Face" button during signup
   */
  const registerFace = async () => {
    // Validate that webcam is available
    if (!webcamRef.current) {
      setMessage('❌ Camera not available');
      return;
    }
    
    setScanning(true);
    setMessage('📸 Capturing face... Please look at the camera');
    
    // Capture screenshot from webcam as base64 JPEG image
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setMessage('❌ Failed to capture image. Please check camera permissions.');
      setScanning(false);
      return;
    }
    
    // Create an HTML Image element to load the screenshot for face-api.js processing
    const img = new Image();
    img.src = screenshot;
    
    // Wait for image to load before running face detection
    img.onload = async () => {
      try {
        // Detect a single face with landmarks and compute face descriptor
        // The descriptor is a 128-dimensional float array unique to each face
        const detection = await faceapi.detectSingleFace(
          img, 
          new faceapi.TinyFaceDetectorOptions()  // Use tiny detector for speed
        ).withFaceLandmarks()                     // Get 68 facial landmarks
         .withFaceDescriptor();                   // Get 128-dimension face descriptor
        
        if (detection) {
          // Face detected successfully - prepare data for storage
          const faceData = {
            descriptor: Array.from(detection.descriptor), // Convert Float32Array to regular array for JSON storage
            image: screenshot                              // Store the captured image
          };
          
          setCapturedFace(faceData);
          setMessage('✅ Face captured successfully! Click Sign Up to complete registration.');
          
          // Notify parent component (Signup) that face was registered
          if (onSuccess) {
            onSuccess(faceData);
          }
        } else {
          // FIX: No face detected - clear any previously captured face data
          // CRITICAL: Do NOT call onSuccess or onError here
          // The parent component should not be notified as if registration succeeded
          setCapturedFace(null);
          setMessage('❌ No face detected. Please look directly at the camera and ensure good lighting.');
          // Note: We intentionally don't call onError to avoid showing error in signup form
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setMessage('❌ Face detection failed. Please try again.');
        setCapturedFace(null); // Clear face data on error
      } finally {
        setScanning(false); // Re-enable the capture button
      }
    };
    
    // Handle image loading errors (corrupted or invalid image data)
    img.onerror = () => {
      setMessage('❌ Failed to process image. Please try again.');
      setScanning(false);
    };
  };

  /**
   * Verifies a face against stored face data for login
   * Compares the current face descriptor with the registered one using Euclidean distance
   */
  const verifyFace = async () => {
    // Validate that webcam is available
    if (!webcamRef.current) {
      setMessage('❌ Camera not available');
      return;
    }
    
    setScanning(true);
    setMessage('🔍 Verifying face... Please look at the camera');
    
    // Capture screenshot from webcam
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setMessage('❌ Failed to capture image');
      setScanning(false);
      return;
    }
    
    const img = new Image();
    img.src = screenshot;
    
    img.onload = async () => {
      try {
        // Detect face and extract descriptor from current webcam image
        const currentFace = await faceapi.detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();
        
        if (!currentFace) {
          setMessage('❌ No face detected. Please look directly at the camera.');
          setScanning(false);
          return;
        }
        
        setMessage('🔍 Fetching your registered face data...');
        
        // Fetch the stored face data from the server
        const response = await fetch('http://localhost:5000/api/get-face-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const saved = await response.json();
        
        if (saved.hasFaceData) {
          // Calculate Euclidean distance between current face and stored face
          // Lower distance = more similar faces
          // Threshold of 0.6 is commonly used for face matching
          const distance = faceapi.euclideanDistance(
            currentFace.descriptor,
            new Float32Array(saved.descriptor) // Convert stored array back to Float32Array
          );
          
          // Calculate match percentage (inverse of distance)
          const matchPercent = Math.round((1 - Math.min(distance, 1)) * 100);
          
          if (distance < 0.6) {
            setMessage(`✅ Face matched! (${matchPercent}%) Logging in...`);
            
            // Complete login after successful face verification
            const loginResponse = await fetch('http://localhost:5000/api/face-id/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, faceIdVerified: true })
            });
            
            const loginData = await loginResponse.json();
            
            if (loginData.success) {
              // Delay success callback slightly for better UX
              setTimeout(() => {
                if (onSuccess) onSuccess(loginData);
              }, 1000);
            } else {
              setMessage('❌ Login failed. Please try again.');
              if (onError) onError('Login failed');
            }
          } else {
            setMessage(`❌ Face does not match (${matchPercent}% match). Please try again or use another verification method.`);
            if (onError) onError('Face does not match');
          }
        } else {
          setMessage('❌ No face registered for this account. Please contact support.');
          if (onError) onError('No face registered');
        }
      } catch (error) {
        console.error('Face verification error:', error);
        setMessage('❌ Verification failed. Please try again.');
        if (onError) onError('Verification failed');
      } finally {
        setScanning(false);
      }
    };
  };

  // Show loading spinner while face detection models are being downloaded
  if (!modelsLoaded) {
    return (
      <div className="face-recognition-container">
        <div className="camera-wrapper loading">
          <div className="loading-spinner"></div>
          <p>Loading face recognition models...</p>
          <p className="hint">This may take a few seconds on first load</p>
        </div>
        <style>{`
          .loading {
            text-align: center;
            padding: 40px;
            background: #f5f5f5;
            border-radius: 10px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .hint {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  // Main render with webcam and controls
  return (
    <div className="face-recognition-container">
      <div className="camera-wrapper">
        {/* Webcam component with mirroring for front-facing camera */}
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 400,
            height: 300,
            facingMode: "user"  // Use front-facing camera on mobile devices
          }}
          style={{ width: '100%', borderRadius: '10px' }}
          mirrored={true}  // Mirror the video for natural user experience
        />
        
        <div className="camera-controls">
          {/* Show different button based on mode (register vs verify) */}
          {mode === 'register' ? (
            <button 
              onClick={registerFace} 
              disabled={scanning} 
              className="btn-capture"
            >
              {scanning ? '📸 Capturing...' : '📸 Register Face'}
            </button>
          ) : (
            <button 
              onClick={verifyFace} 
              disabled={scanning} 
              className="btn-verify"
            >
              {scanning ? '🔍 Verifying...' : '😀 Verify Face'}
            </button>
          )}
          
          {/* Cancel button (optional) */}
          {onCancel && (
            <button onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
          )}
        </div>
        
        {/* Status message display with color coding */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}
        
        {/* Tips section - only shown during registration when no face is captured yet */}
        {mode === 'register' && !capturedFace && !scanning && (
          <div className="tips">
            <p>💡 Tips for best results:</p>
            <ul>
              <li>Look directly at the camera</li>
              <li>Ensure good lighting</li>
              <li>Remove glasses if possible</li>
              <li>Keep your face centered</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Component styles */}
      <style>{`
        .face-recognition-container {
          margin: 20px 0;
        }
        .camera-wrapper {
          background: #000;
          border-radius: 10px;
          overflow: hidden;
          text-align: center;
        }
        .camera-controls {
          display: flex;
          gap: 10px;
          padding: 15px;
          justify-content: center;
          background: #1a1a1a;
        }
        .btn-capture, .btn-verify {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: transform 0.2s;
        }
        .btn-capture:hover:not(:disabled), .btn-verify:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .btn-cancel {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-cancel:hover {
          transform: scale(1.05);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .message {
          padding: 10px;
          margin: 10px;
          border-radius: 8px;
          text-align: center;
          font-size: 14px;
        }
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .message.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        .tips {
          padding: 15px;
          background: #f8f9fa;
          text-align: left;
          font-size: 12px;
          border-top: 1px solid #ddd;
        }
        .tips p {
          margin: 0 0 5px 0;
          font-weight: bold;
        }
        .tips ul {
          margin: 0;
          padding-left: 20px;
        }
        .tips li {
          margin: 3px 0;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default FaceRecognition;