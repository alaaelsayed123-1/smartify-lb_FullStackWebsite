  // ============================================================
  // SMARTIFY LB - MAIN SERVER FILE
  // ============================================================
  // This is the heart of the backend. It starts the Express server,
  // connects to MySQL, loads all API routes, and handles:
  // - Customer authentication (signup, login, 2FA)
  // - Face recognition registration and login
  // - Product management
  // - Cart and favorites
  // - Order processing with WhatsApp notifications
  // - AI features (search, analytics, chatbot, groc AI)
  // - Password reset via email
  // ============================================================

  // Force load .env file FIRST (before anything else)
  // This ensures all environment variables are available when other modules load
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });

  // Core dependencies
  const express = require("express");
  const pool = require("./config/mysql");  // MySQL connection pool from config
  const cors = require("cors");  // Cross-Origin Resource Sharing for frontend access
  const bcrypt = require("bcrypt");  // Password hashing for security
  const jwt = require("jsonwebtoken");  // JSON Web Tokens for authentication
  const crypto = require('crypto');  // For generating secure random tokens
  const nodemailer = require('nodemailer');  // Email sending for 2FA and other notifications

  // Import free WhatsApp service
  // This provides free WhatsApp messaging through whatsapp-web.js library
const emailNotifications = require('./services/emailNotificationsService');
//const freeWhatsapp = require('./services/freeWhatsappService'); 
  // ============================================================
  // GROQ AI INTEGRATION - FREE & SUPER FAST!
  // ============================================================
  // Groq provides free access to Llama 3.3 70B model with 30 requests/min
  const Groq = require('groq-sdk');
  let groq = null;
  try {
    // Initialize Groq with API key from environment variables
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY // Reads from your .env file
    });
    console.log('⚡ Groq AI: ✅ INITIALIZED - FREE super-fast AI responses ENABLED');
  } catch (error) {
    // If Groq fails to initialize, continue without AI features
    console.log('⚠️ Groq initialization failed:', error.message);
  }
  // Create the Express application
  const app = express();

  // Debug: Check if .env loaded correctly
  // These logs help troubleshoot configuration issues quickly
  console.log('=================================');
  console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ LOADED' : '❌ MISSING');
  console.log('DB_HOST:', process.env.DB_HOST || '❌ MISSING');
  console.log('DB_USER:', process.env.DB_USER || '❌ MISSING');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ LOADED' : '❌ MISSING');
  console.log('=================================\n');

  /* ================= MIDDLEWARE SETUP ================= */
  // CORS configuration - allows frontend running on these ports to access the API
  app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5000"],
    credentials: true  // Allows cookies and auth headers
  }));

  // Parse JSON bodies with 50MB limit (needed for face recognition image data)
  app.use(express.json({ limit: '50mb' }));

  // Serve static images from public/images directory
  app.use('/images', express.static('public/images'));

  // Request logging middleware - logs every API request with timestamp
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  /* ================= TEST ENDPOINTS ================= */
  // Basic route to check if server is running
  app.get("/", (req, res) => res.send("Smartify API running ✅"));

  // Test endpoint for frontend to verify server connectivity
  app.get("/test", (req, res) => res.json({ message: "Server is running!", status: "online" }));

  // Health check endpoint - also verifies database connection
  app.get("/api/health", async (req, res) => {
    try {
      // Try to execute a simple query to check database connectivity
      await pool.query("SELECT 1");
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      // Database is down or unreachable
      res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
  });

  /* ================= EMAIL TRANSPORTER SETUP ================= */
  // Configure nodemailer to use Gmail SMTP
  // Uses app-specific password from environment variables for security
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,  // Standard SMTP port for TLS
    secure: false,  // Use TLS (not SSL)
    auth: {
      user: process.env.EMAIL_USER,  // Your Gmail address
      pass: process.env.EMAIL_PASS   // Gmail app-specific password
    }
  });

  /* ================= PRODUCTS ENDPOINTS ================= */
  // GET all products - returns product listing with stock status
  app.get("/api/products", async (req, res) => {
    try {
      // Select key product fields and determine if in stock
      const [rows] = await pool.query(`
        SELECT id, name, price, quantity, image, sale,
              CASE WHEN quantity > 0 THEN true ELSE false END as in_stock
        FROM products ORDER BY id DESC
      `);
      res.json(rows);
    } catch (error) { 
      console.error("Products error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // GET single product by ID - for product detail pages
  app.get("/api/products/:id", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
      res.json(rows[0]);
    } catch (error) { 
      console.error("Product error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= CUSTOMER AUTH WITH 2FA ================= */
  // Customer signup - creates new account with 2FA enabled by default
  app.post("/api/customers/signup", async (req, res) => {
  const { first_name, last_name, email, password, phone, enable2FA } = req.body;  
    // Validate required fields
    if (!first_name || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    
    try {
      // Check if email already exists in database
      const [exists] = await pool.query("SELECT id FROM customers WHERE email = ?", [email.toLowerCase()]);
      if (exists.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // Hash password with bcrypt (10 salt rounds)
      const hashed = await bcrypt.hash(password, 10);
      
      // Insert new customer with 2FA enabled by default (is_2fa_enabled = 1)
      const [result] = await pool.query(
        "INSERT INTO customers (first_name, last_name, email, password, phone, is_2fa_enabled) VALUES (?, ?, ?, ?, ?, ?)",
  [first_name, last_name || "", email.toLowerCase(), hashed, phone || "", enable2FA ? 1 : 0]    );
      
      // Generate JWT token valid for 7 days
      const token = jwt.sign(
        { id: result.insertId, type: "customer" }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
      );
      
      res.status(201).json({ 
        token, 
        customer: { 
          id: result.insertId, 
          first_name, 
          last_name: last_name || "", 
          email: email.toLowerCase() 
        } 
      });
    } catch (error) { 
      console.error("Signup error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Customer login - with 2FA verification if enabled
  app.post("/api/customers/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // Find customer by email (must be active)
      const [rows] = await pool.query(
        "SELECT * FROM customers WHERE email = ? AND is_active = 1", 
        [email.toLowerCase()]
      );
      
      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const customer = rows[0];
      
      // Verify password against hashed version
      const match = await bcrypt.compare(password, customer.password);
      
      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if 2FA is enabled for this customer
      const is2FAEnabled = customer.is_2fa_enabled === 1;
      
      if (is2FAEnabled) {
        // Generate 6-digit verification code and secure token
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Clean up any unused verification tokens for this customer
  try {
    await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer.id]);
  } catch (cleanupError) {
    if (cleanupError.code === 'ER_LOCK_WAIT_TIMEOUT') {
      console.log(`⚠️ Lock timeout when cleaning old codes for customer ${customer.id}, continuing login...`);
      // Continue with login even if cleanup fails
    } else {
      throw cleanupError; // Re-throw if it's a different error
    }
  }
        
        // Store verification data in database
        await pool.query(
          `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
          VALUES (?, ?, ?, ?)`,
          [customer.id, verificationToken, verificationCode, expiresAt]
        );
        
        // Create verification link for one-click login
        const verificationLink = `http://localhost:3000/verify-login?token=${verificationToken}&email=${encodeURIComponent(customer.email)}`;
        
        // Send 2FA email with verification code and link
        const mailOptions = {
          from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
          to: customer.email,
          subject: '🔐 Login Verification - Smartify LB',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #667eea;">Verify Your Login</h2>
              <p>Hello ${customer.first_name},</p>
              <p>Someone is trying to log into your Smartify LB account.</p>
              <p>If this was you, click the button below to complete login:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                  style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  ✅ Yes, It's Me
                </a>
              </div>
              
              <p>Or use this verification code:</p>
              <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 10px;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</span>
              </div>
              
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email or change your password.</p>
              <hr>
              <p style="font-size: 12px; color: #666;">Smartify LB - Your Security Matters</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        
        // Return 202 Accepted - login incomplete, waiting for 2FA
        return res.status(202).json({ 
          requires2FA: true,
          message: "Verification code sent to your email. Please check and verify.",
          customerId: customer.id,
          email: customer.email
        });
      } else {
        // 2FA disabled - direct login
        const isFirstLogin = !customer.last_login;  // Check if this is their first time
        
        // Update last login timestamp
        await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [customer.id]);
        
        // Generate JWT token for authenticated sessions
        const token = jwt.sign(
          { id: customer.id, type: "customer" }, 
          process.env.JWT_SECRET, 
          { expiresIn: "7d" }
        );
        
        // Send WhatsApp welcome message on first login if phone exists
       if (isFirstLogin && customer.email) {
  await emailNotifications.sendWelcomeEmail(customer.email, customer.first_name);
}
        
        res.json({ 
          success: true,
          token, 
          customer: { 
            id: customer.id, 
            first_name: customer.first_name, 
            last_name: customer.last_name, 
            email: customer.email 
          } 
        });
      }
    } catch (error) { 
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Verify 2FA login - completes the authentication process
  app.post("/api/verify-2fa-login", async (req, res) => {
    const { email, token, code } = req.body;
    
    try {
      let verification;
      
      // Verify by token (from email link click)
      if (token) {
        [verification] = await pool.query(
          `SELECT v.*, c.first_name, c.last_name, c.phone, c.email 
          FROM login_verifications v
          JOIN customers c ON v.customer_id = c.id
          WHERE v.verification_token = ? AND v.is_used = FALSE AND v.expires_at > NOW()`,
          [token]
        );
      } 
      // Verify by code (from manual entry)
      else if (code) {
        [verification] = await pool.query(
          `SELECT v.*, c.first_name, c.last_name, c.phone, c.email 
          FROM login_verifications v
          JOIN customers c ON v.customer_id = c.id
          WHERE v.verification_code = ? AND v.is_used = FALSE AND v.expires_at > NOW()`,
          [code]
        );
      } else {
        return res.status(400).json({ message: "Token or code required" });
      }
      
      // Check if verification exists and is valid
      if (verification.length === 0) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      // Mark verification as used (prevent replay attacks)
      await pool.query("UPDATE login_verifications SET is_used = TRUE WHERE id = ?", [verification[0].id]);
      
      // Check if this is the customer's first login
      const isFirstLogin = !verification[0].last_login;
      
      // Update last login timestamp
      await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [verification[0].customer_id]);
      
      // Generate final JWT token for authenticated session
      const jwtToken = jwt.sign(
        { id: verification[0].customer_id, type: "customer" }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
      );
      
      if (isFirstLogin && verification[0].email) {
  await emailNotifications.sendWelcomeEmail(verification[0].email, verification[0].first_name);
}
      
      res.json({ 
        success: true,
        token: jwtToken,
        customer: {
          id: verification[0].customer_id,
          first_name: verification[0].first_name,
          last_name: verification[0].last_name,
          email: verification[0].email
        }
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Resend 2FA code - generates new verification code
  app.post("/api/resend-2fa-code", async (req, res) => {
    const { email } = req.body;
    
    try {
      // Find the customer
      const [customer] = await pool.query(
        "SELECT id, first_name FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Remove old unused tokens
  // Remove old unused tokens
  try {
    await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer[0].id]);
  } catch (cleanupError) {
    if (cleanupError.code === 'ER_LOCK_WAIT_TIMEOUT') {
      console.log(`⚠️ Lock timeout when cleaning old codes for customer ${customer[0].id}, continuing...`);
      // Continue even if cleanup fails
    } else {
      throw cleanupError; // Re-throw if it's a different error
    }
  }    
      // Store new verification
      await pool.query(
        `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
        VALUES (?, ?, ?, ?)`,
        [customer[0].id, verificationToken, verificationCode, expiresAt]
      );
      
      // Create new verification link
      const verificationLink = `http://localhost:3000/verify-login?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      // Send new verification email
      const mailOptions = {
        from: `"Smartify LB Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 New Login Verification Code - Smartify LB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #667eea;">New Verification Code</h2>
            <p>Hello ${customer[0].first_name},</p>
            <p>Here is your new verification code:</p>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 10px;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</span>
            </div>
            <p>Or click here: <a href="${verificationLink}">Verify Login</a></p>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      
      res.json({ success: true, message: "New verification code sent" });
    } catch (error) {
      console.error("Resend code error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  /* ================= FACE RECOGNITION ENDPOINTS ================= */
  // ============================================================
  // WEBAUTHN ENDPOINTS FOR BIOMETRIC AUTHENTICATION
  // ============================================================

  // Step 1: Generate registration challenge
  app.post("/api/webauthn/register-challenge", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT id FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      const challenge = crypto.randomBytes(32).toString('base64url');
      const userId = customer[0].id.toString();
      
      res.json({
        challenge: challenge,
        userId: btoa(userId),
        rpName: "Smartify LB",
        rpId: "localhost"
      });
    } catch (error) {
      console.error("WebAuthn challenge error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Step 2: Verify and save WebAuthn credentials
  app.post("/api/webauthn/register-verify", async (req, res) => {
    const { email, credentialId, publicKey } = req.body;
    
    try {
      await pool.query(
        "UPDATE customers SET webauthn_credential_id = ?, webauthn_public_key = ?, face_id_enabled = 1 WHERE email = ?",
        [credentialId, publicKey, email.toLowerCase()]
      );
      
      res.json({ success: true, message: "Biometric registered successfully!" });
    } catch (error) {
      console.error("WebAuthn verify error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Step 3: Generate login challenge
  app.post("/api/webauthn/login-challenge", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT id, webauthn_credential_id FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      if (!customer[0].webauthn_credential_id) {
        return res.json({ 
          error: "No biometrics registered", 
          allowCredentials: [] 
        });
      }
      
      const challenge = crypto.randomBytes(32).toString('base64url');
      
      res.json({
        challenge: challenge,
        rpId: "localhost",
        allowCredentials: [{
          id: customer[0].webauthn_credential_id,
          type: "public-key",
          transports: ["internal"]
        }]
      });
    } catch (error) {
      console.error("WebAuthn login challenge error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Step 4: Verify login assertion
  app.post("/api/webauthn/login-verify", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT * FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      
      // In production, you should verify the signature here
      // For now, we trust the browser's biometric verification
      
      const token = jwt.sign(
        { id: customer[0].id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({
        success: true,
        token,
        customer: {
          id: customer[0].id,
          first_name: customer[0].first_name,
          last_name: customer[0].last_name,
          email: customer[0].email
        }
      });
    } catch (error) {
      console.error("WebAuthn login verify error:", error);
      res.status(500).json({ success: false, message: "Verification failed" });
    }
  });

  // Face ID verification after successful face match (for FaceRecognition component)
  app.post("/api/face-id/verify", async (req, res) => {
    const { email, faceIdVerified } = req.body;
    
    try {
      if (!faceIdVerified) {
        return res.status(400).json({ success: false, message: "Face verification required" });
      }
      
      const [customer] = await pool.query(
        "SELECT * FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      
      const token = jwt.sign(
        { id: customer[0].id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({
        success: true,
        token,
        customer: {
          id: customer[0].id,
          first_name: customer[0].first_name,
          last_name: customer[0].last_name,
          email: customer[0].email
        }
      });
    } catch (error) {
      console.error("Face ID verify error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Send email verification code for face recognition setup
  app.post("/api/send-email-code", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT id, first_name FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Generate verification code for face recognition setup
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer[0].id]);
      
      await pool.query(
        `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
        VALUES (?, ?, ?, ?)`,
        [customer[0].id, verificationToken, verificationCode, expiresAt]
      );
      
      // Send verification email with code
      const mailOptions = {
        from: `"Smartify LB " <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Login Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px;">
            <h2>Verification Code</h2>
            <p>Hello ${customer[0].first_name},</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center;">
              <span style="font-size: 32px; letter-spacing: 5px;">${verificationCode}</span>
            </div>
            <p>This code expires in 10 minutes.</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Code sent to your email" });
    } catch (error) {
      console.error("Send email code error:", error);
      res.status(500).json({ message: "Failed to send code" });
    }
  });

  // Verify email code - complete setup verification
  app.post("/api/verify-email-code", async (req, res) => {
    const { email, code } = req.body;
    
    try {
      const [verification] = await pool.query(
        `SELECT v.*, c.id as customer_id, c.first_name, c.last_name, c.email 
        FROM login_verifications v
        JOIN customers c ON v.customer_id = c.id
        WHERE c.email = ? AND v.verification_code = ? AND v.is_used = FALSE AND v.expires_at > NOW()`,
        [email.toLowerCase(), code]
      );
      
      if (verification.length === 0) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }
      
      // Mark code as used and update login timestamp
      await pool.query("UPDATE login_verifications SET is_used = TRUE WHERE id = ?", [verification[0].id]);
      await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [verification[0].customer_id]);
      
      const token = jwt.sign(
        { id: verification[0].customer_id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({
        success: true,
        token,
        customer: {
          id: verification[0].customer_id,
          first_name: verification[0].first_name,
          last_name: verification[0].last_name,
          email: verification[0].email
        }
      });
    } catch (error) {
      console.error("Verify email code error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Check if customer has face ID enabled
  app.post("/api/face-id/check", async (req, res) => {
    const { email } = req.body;
    try {
      const [customer] = await pool.query(
        "SELECT face_id_enabled FROM customers WHERE email = ?",
        [email.toLowerCase()]
      );
      res.json({ hasFaceID: customer.length > 0 && customer[0].face_id_enabled === 1 });
    } catch (error) {
      res.status(500).json({ hasFaceID: false });
    }
  });

  // Save face recognition data to customer profile
  app.post("/api/save-face-data", async (req, res) => {
    const { email, faceData } = req.body;
    
    if (!email || !faceData) {
      return res.status(400).json({ message: "Email and face data required" });
    }
    
    try {
      const [customer] = await pool.query(
        "SELECT id FROM customers WHERE email = ?",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Store face data as JSON string in database
      await pool.query(
        "UPDATE customers SET face_data = ? WHERE email = ?",
        [JSON.stringify(faceData), email.toLowerCase()]
      );
      
      res.json({ success: true, message: "Face data saved successfully!" });
    } catch (error) {
      console.error("Save face error:", error);
      res.status(500).json({ message: "Failed to save face data" });
    }
  });

  // Retrieve face data for login
  app.post("/api/get-face-data", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT face_data FROM customers WHERE email = ?",
        [email.toLowerCase()]
      );
      
      if (customer.length === 0 || !customer[0].face_data) {
        return res.json({ hasFaceData: false });
      }
      
      // Parse stored JSON face data
      const faceData = JSON.parse(customer[0].face_data);
      res.json({ 
        hasFaceData: true, 
        descriptor: faceData.descriptor,
        image: faceData.image
      });
    } catch (error) {
      console.error("Get face error:", error);
      res.status(500).json({ hasFaceData: false, message: "Server error" });
    }
  });

  // Quick check if face data exists for a customer
  app.post("/api/check-face-data", async (req, res) => {
    const { email } = req.body;
    
    try {
      const [customer] = await pool.query(
        "SELECT face_data FROM customers WHERE email = ?",
        [email.toLowerCase()]
      );
      
      const hasFaceData = customer.length > 0 && customer[0].face_data !== null;
      res.json({ hasFaceData });
    } catch (error) {
      console.error("Check face error:", error);
      res.status(500).json({ hasFaceData: false });
    }
  });

  /* ================= AUTH MIDDLEWARE ================= */
  // Middleware to authenticate customers via JWT token
  const authenticateCustomer = async (req, res, next) => {
    const header = req.headers.authorization;
    
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Login required" });
    }
    
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify the token is for a customer (not admin)
      if (decoded.type !== "customer") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Verify customer still exists and is active
      const [customer] = await pool.query(
        "SELECT id, is_active FROM customers WHERE id = ?", 
        [decoded.id]
      );
      
      if (customer.length === 0 || !customer[0].is_active) {
        return res.status(401).json({ message: "Account not found or inactive" });
      }
      
      // Attach customer info to request object
      req.customer = decoded;
      req.customerId = decoded.id;
      next();
    } catch (err) { 
      return res.status(401).json({ message: "Invalid token" }); 
    }
  };

  // Middleware to authenticate admin users
  const authenticateAdmin = (req, res, next) => {
    // STEP 1: Check if they have a VIP pass (JWT token)
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin login required" });
    }
    
    // STEP 2: Verify the VIP pass is real
    try {
      const token = header.split(" ")[1];          // Get the actual token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode it
      
      // STEP 3: Check if they're actually an admin
      if (decoded.type !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // STEP 4: Let them in!
      req.admin = decoded;  // Attach admin info
      next();               // Move to next step
    } catch (err) { 
      return res.status(401).json({ message: "Invalid token" }); 
    }
  };

  /* ================= 2FA TOGGLE ================= */
  // Enable or disable 2FA for authenticated customer
  app.post("/api/toggle-2fa", authenticateCustomer, async (req, res) => {
    const { enabled } = req.body;  // "Turn 2FA ON" or "Turn 2FA OFF"
    
    try {
      // Update the database: set is_2fa_enabled to 1 (ON) or 0 (OFF)
      await pool.query(
        "UPDATE customers SET is_2fa_enabled = ? WHERE id = ?",
        [enabled ? 1 : 0, req.customerId]  // If enabled=true → 1, else → 0
      );
      
      res.json({ success: true, message: `2FA ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  /* ================= CART ENDPOINTS ================= */
  // Get customer's cart with product details
  app.get("/api/cart", authenticateCustomer, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image, p.quantity as stock 
        FROM cart c 
        INNER JOIN products p ON c.product_id = p.id 
        WHERE c.customer_id = ? 
        ORDER BY c.created_at DESC
      `, [req.customerId]);
      res.json(rows);
    } catch (error) { 
      console.error("Cart error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Add item to cart (or update quantity if already exists)
  app.post("/api/cart", authenticateCustomer, async (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product ID required" });
    
    try {
      // Check if product exists and has enough stock
      const [product] = await pool.query("SELECT id, quantity as stock FROM products WHERE id = ?", [product_id]);
      if (product.length === 0) return res.status(404).json({ message: "Product not found" });
      if (product[0].stock < quantity) return res.status(400).json({ message: "Insufficient stock" });
      
      // Check if product already in cart
      const [existing] = await pool.query(
        "SELECT id, quantity FROM cart WHERE customer_id = ? AND product_id = ?", 
        [req.customerId, product_id]
      );
      
      if (existing.length > 0) {
        // Update existing cart item quantity
        const newQuantity = existing[0].quantity + quantity;
        if (product[0].stock < newQuantity) return res.status(400).json({ message: "Insufficient stock" });
        await pool.query(
          "UPDATE cart SET quantity = ? WHERE customer_id = ? AND product_id = ?", 
          [newQuantity, req.customerId, product_id]
        );
        res.json({ success: true, message: "Cart updated" });
      } else {
        // Add new item to cart
        await pool.query(
          "INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?)", 
          [req.customerId, product_id, quantity]
        );
        res.json({ success: true, message: "Added to cart" });
      }
    } catch (error) { 
      console.error("Add to cart error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Update cart item quantity
  app.put("/api/cart/:itemId", authenticateCustomer, async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });
    
    try {
      // Find cart item and verify ownership
      const [cartItem] = await pool.query(
        "SELECT product_id FROM cart WHERE id = ? AND customer_id = ?", 
        [req.params.itemId, req.customerId]
      );
      
      if (cartItem.length === 0) return res.status(404).json({ message: "Cart item not found" });
      
      // Check stock availability
      const [product] = await pool.query("SELECT quantity FROM products WHERE id = ?", [cartItem[0].product_id]);
      if (product[0].quantity < quantity) return res.status(400).json({ message: "Insufficient stock" });
      
      await pool.query(
        "UPDATE cart SET quantity = ? WHERE id = ? AND customer_id = ?", 
        [quantity, req.params.itemId, req.customerId]
      );
      res.json({ success: true, message: "Cart updated" });
    } catch (error) { 
      console.error("Update cart error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Remove item from cart
  app.delete("/api/cart/:itemId", authenticateCustomer, async (req, res) => {
    try {
      await pool.query("DELETE FROM cart WHERE id = ? AND customer_id = ?", [req.params.itemId, req.customerId]);
      res.json({ success: true });
    } catch (error) { 
      console.error("Delete cart error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Clear entire cart
  app.delete("/api/cart", authenticateCustomer, async (req, res) => {
    try {
      await pool.query("DELETE FROM cart WHERE customer_id = ?", [req.customerId]);
      res.json({ success: true });
    } catch (error) { 
      console.error("Clear cart error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= FAVORITES ENDPOINTS ================= */
  // Get customer's favorites with product details
  app.get("/api/favorites", authenticateCustomer, async (req, res) => {
    try {
      const [rows] = await pool.query(`
SELECT f.id, f.product_id, f.created_at, p.name, p.price, p.image, p.sale, p.quantity        FROM favorites f 
        INNER JOIN products p ON f.product_id = p.id 
        WHERE f.customer_id = ? 
        ORDER BY f.created_at DESC
      `, [req.customerId]);
      res.json(rows);
    } catch (error) { 
      console.error("Favorites error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Add product to favorites
  app.post("/api/favorites", authenticateCustomer, async (req, res) => {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product ID required" });
    
    try {
      // Verify product exists
      const [product] = await pool.query("SELECT id FROM products WHERE id = ?", [product_id]);
      if (product.length === 0) return res.status(404).json({ message: "Product not found" });
      
      // Check if already favorited
      const [existing] = await pool.query(
        "SELECT id FROM favorites WHERE customer_id = ? AND product_id = ?", 
        [req.customerId, product_id]
      );
      
      if (existing.length > 0) return res.status(400).json({ message: "Already in favorites" });
      
      await pool.query(
        "INSERT INTO favorites (customer_id, product_id) VALUES (?, ?)", 
        [req.customerId, product_id]
      );
      res.json({ success: true });
    } catch (error) { 
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Remove product from favorites
  app.delete("/api/favorites/:productId", authenticateCustomer, async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM favorites WHERE customer_id = ? AND product_id = ?", 
        [req.customerId, req.params.productId]
      );
      res.json({ success: true });
    } catch (error) { 
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= ORDERS ENDPOINTS ================= */
  // Create new order from cart items
  app.post("/api/orders", authenticateCustomer, async (req, res) => {
    const { 
      customer_email, customer_first_name, customer_last_name, customer_phone,
      shipping_address, shipping_city, shipping_country, shipping_postal_code,
      shipping_method, payment_method, billing_address, billing_same_as_shipping 
    } = req.body;
    
    try {
      // Get all items from customer's cart
      const [cartItems] = await pool.query(`
        SELECT c.product_id, c.quantity, p.name, p.price 
        FROM cart c 
        INNER JOIN products p ON c.product_id = p.id 
        WHERE c.customer_id = ?
      `, [req.customerId]);
      
      if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });
      
      // Calculate order totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping_cost = shipping_method === "express" ? 3.00 : 0.00;  // Express shipping costs $3
      const total_amount = subtotal + shipping_cost;
      
      // Generate unique order number
      const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Format order items for storage
      const items = cartItems.map(item => ({ 
        product_id: item.product_id, 
        product_name: item.name, 
        product_price: parseFloat(item.price), 
        quantity: item.quantity, 
        subtotal: parseFloat(item.price) * item.quantity 
      }));
      
      // Use transaction to ensure data consistency
      await pool.query("START TRANSACTION");
      
      // Insert main order record
      const [orderResult] = await pool.query(
        `INSERT INTO orders (
          order_number, customer_id, customer_email, customer_first_name, customer_last_name,
          customer_phone, shipping_address, shipping_city, shipping_country, shipping_postal_code,
          shipping_method, shipping_cost, payment_method, billing_address, billing_same_as_shipping,
          subtotal, total_amount, items, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_number, req.customerId, customer_email, customer_first_name, customer_last_name || "",
          customer_phone || "", shipping_address, shipping_city, shipping_country, shipping_postal_code || "",
          shipping_method, shipping_cost, payment_method, billing_address || "", billing_same_as_shipping || 0,
          subtotal, total_amount, JSON.stringify(items), "pending"
        ]
      );
      
      // Insert individual order items and update product stock
      for (const item of cartItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [orderResult.insertId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity]
        );
        // Decrease product stock
        await pool.query("UPDATE products SET quantity = quantity - ? WHERE id = ?", [item.quantity, item.product_id]);
      }
      
      // Clear the customer's cart after order is placed
      await pool.query("DELETE FROM cart WHERE customer_id = ?", [req.customerId]);
      
      // Commit transaction
      await pool.query("COMMIT");
      
     if (customer_email) {
  console.log(`📧 SENDING order confirmation to ${customer_email}`);
  await emailNotifications.sendOrderConfirmation(
    customer_email, order_number, total_amount, customer_first_name, items
  );
}
      
      res.status(201).json({ success: true, order_number, total_amount });
    } catch (error) {
      // Rollback transaction on error
      await pool.query("ROLLBACK");
      console.error("Order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get customer's order history
  app.get("/api/orders", authenticateCustomer, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, order_number, total_amount, order_status, created_at 
        FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
        [req.customerId]
      );
      res.json(rows);
    } catch (error) { 
      console.error("Orders error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= ADMIN AUTH ================= */
  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    
    // Detailed logging for debugging admin login issues
    console.log('\n=================================');
    console.log('🔐 ADMIN LOGIN ATTEMPT');
    console.log(`📧 Email: ${email}`);
    console.log('=================================');
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    try {
      // Find admin user by email
      const [rows] = await pool.query(
        "SELECT * FROM admin_users WHERE email = ? AND is_active = 1", 
        [email]
      );
      
      if (rows.length === 0) {
        console.log('❌ No admin found');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const admin = rows[0];
      console.log(`✅ Admin found: ${admin.username} (ID: ${admin.id})`);
      
      // Verify password
      const isValid = await bcrypt.compare(password, admin.password);
      
      if (!isValid) {
        console.log('❌ Password validation failed');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log('✅ Password validated!');
      
      // Update last login timestamp
      await pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [admin.id]);
      
      // Generate JWT with admin type and role
      const token = jwt.sign(
        { id: admin.id, email: admin.email, type: "admin", role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      console.log('✅ JWT Token generated');
      console.log('=================================\n');
      
      res.json({ 
        token, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email, 
          role: admin.role 
        } 
      });
      
    } catch (error) { 
      console.error('❌ Admin login error:', error);
      console.log('=================================\n');
      res.status(500).json({ message: "Server error. Please try again." }); 
    }
  });

  /* ================= ADMIN PRODUCTS ================= */
  // Add new product (admin only)
  app.post("/api/admin/products", authenticateAdmin, async (req, res) => {
    const { name, price, quantity, image, sale } = req.body;
    try {
      const [result] = await pool.query(
        "INSERT INTO products (name, price, quantity, image, sale) VALUES (?, ?, ?, ?, ?)",
        [name, price, quantity, image || "", sale ? 1 : 0]
      );
      res.json({ success: true, id: result.insertId });
    } catch (error) { 
      console.error("Add product error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Update existing product (admin only)
  app.put("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    const { name, price, quantity, image, sale } = req.body;
    try {
      await pool.query(
        "UPDATE products SET name=?, price=?, quantity=?, image=?, sale=? WHERE id=?",
        [name, price, quantity, image || "", sale ? 1 : 0, req.params.id]
      );
      res.json({ success: true });
    } catch (error) { 
      console.error("Update product error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Delete product (admin only)
  app.delete("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) { 
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= ADMIN ORDERS ================= */
  // Get all orders with customer info (admin only)
  app.get("/api/admin/orders", authenticateAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT o.*, c.first_name, c.last_name 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC
      `);
      res.json(rows);
    } catch (error) { 
      console.error("Admin orders error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Update order status and send WhatsApp notification (admin only)
  app.put("/api/admin/orders/:orderId/status", authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    try {
      // Update order status
      await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [status, req.params.orderId]);

 const [orderInfo] = await pool.query(
  "SELECT order_number, customer_first_name, customer_email FROM orders WHERE id = ?",
  [req.params.orderId]
);
      // Send appropriate WhatsApp notification based on status
      if (orderInfo.length > 0 && orderInfo[0].customer_email) {
  const customerEmail = orderInfo[0].customer_email;
  const orderNumber = orderInfo[0].order_number;
  const customerName = orderInfo[0].customer_first_name;
  
  if (status === 'shipped') {
    await emailNotifications.sendOrderShipped(customerEmail, orderNumber, customerName);
  } else if (status === 'delivered') {
    await emailNotifications.sendOrderDelivered(customerEmail, orderNumber, customerName);
  } else if (status === 'cancelled' || status === 'Cancelled') {
    await emailNotifications.sendOrderCancelled(customerEmail, orderNumber, customerName);
  } else if (status === 'processing' || status === 'Processing') {
    await emailNotifications.sendOrderProcessing(customerEmail, orderNumber, customerName);
  }
}
      
      res.json({ success: true });
    } catch (error) { 
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Delete order and its items (admin only)
  app.delete("/api/admin/orders/:orderId", authenticateAdmin, async (req, res) => {
    try {
      // Delete order items first (foreign key constraint)
      await pool.query("DELETE FROM order_items WHERE order_id = ?", [req.params.orderId]);
      await pool.query("DELETE FROM orders WHERE id = ?", [req.params.orderId]);
      res.json({ success: true });
    } catch (error) { 
      console.error("Delete order error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  // Admin dashboard statistics
  app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
    try {
      // Get counts and revenue from database
      const [totalOrders] = await pool.query("SELECT COUNT(*) as count FROM orders");
      const [totalCustomers] = await pool.query("SELECT COUNT(*) as count FROM customers");
      const [totalProducts] = await pool.query("SELECT COUNT(*) as count FROM products");
      const [totalRevenue] = await pool.query(
        "SELECT SUM(total_amount) as total FROM orders WHERE order_status != 'cancelled'"
      );
      res.json({ 
        total_orders: totalOrders[0].count, 
        total_customers: totalCustomers[0].count, 
        total_products: totalProducts[0].count, 
        total_revenue: totalRevenue[0].total || 0 
      });
    } catch (error) { 
      console.error("Stats error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

  /* ================= AI FEATURES ================= */
  // AI-powered product search with natural language understanding
  app.get("/api/ai-search", async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === "") return res.json([]);
    
    try {
      // Get all available products
      const [products] = await pool.query("SELECT * FROM products WHERE quantity > 0");
      const query = q.toLowerCase().trim();
      const keywords = query.split(' ');
      
      // Parse price filters from natural language
      let priceMin = null, priceMax = null;
      const underMatch = query.match(/(?:under|below|less than)\s*\$?(\d+)/);
      if (underMatch) priceMax = parseInt(underMatch[1]);
      const overMatch = query.match(/(?:over|above|more than)\s*\$?(\d+)/);
      if (overMatch) priceMin = parseInt(overMatch[1]);
      const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
      if (rangeMatch) { priceMin = parseInt(rangeMatch[1]); priceMax = parseInt(rangeMatch[2]); }
      
      // Score products by relevance to search query
      const scoredProducts = products.map(product => {
        let score = 0;
        const productName = product.name.toLowerCase();
        const productPrice = parseFloat(product.price);
        
        keywords.forEach(keyword => {
          if (keyword.length < 2) return;
          if (productName === keyword) score += 50;  // Exact match
          else if (productName.includes(keyword)) score += 20;  // Partial match
        });
        
        if (product.sale && (query.includes('sale') || query.includes('discount'))) score += 30;
        if (priceMin && productPrice >= priceMin) score += 15;
        if (priceMax && productPrice <= priceMax) score += 15;
        
        return { ...product, relevanceScore: score };
      });
      
      // Return top 24 results sorted by relevance
      const results = scoredProducts
        .filter(p => p.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 24);
      res.json(results);
    } catch (error) { 
      console.error("Search error:", error);
      res.status(500).json({ message: "Search error" }); 
    }
  });

  // Product recommendations based on price range
  app.get("/api/recommendations/:productId", async (req, res) => {
    try {
      const [product] = await pool.query("SELECT price, name FROM products WHERE id = ?", [req.params.productId]);
      if (product.length === 0) return res.json([]);
      
      // Find products within 30% price range
      const minPrice = product[0].price * 0.7;
      const maxPrice = product[0].price * 1.3;
      const [priceRange] = await pool.query(
        `SELECT id, name, price, image, sale, quantity 
        FROM products 
        WHERE price BETWEEN ? AND ? AND id != ? AND quantity > 0 
        LIMIT 6`,
        [minPrice, maxPrice, req.params.productId]
      );
      res.json(priceRange);
    } catch (error) { 
      console.error("Recommendations error:", error);
      res.status(500).json({ message: "Server error" }); 
    }
  });

 // Fetches 6 newest in-stock products for authenticated users
app.get("/api/personalized-recommendations", authenticateCustomer, async (req, res) => {
  try {
    // Get latest 6 products with stock available (newest ID first)
    const [popular] = await pool.query(
      `SELECT id, name, price, image, sale, quantity 
      FROM products WHERE quantity > 0 
      ORDER BY id DESC LIMIT 6`
    );
    // Return products as JSON (same for all users — not truly personalized)
    res.json(popular);
  } catch (error) { 
    // Log error, send generic 500 response to client
    console.error("Personalized recommendations error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

// Keyword-based sentiment analysis for product reviews
app.post("/api/ai/sentiment", async (req, res) => {
  const { review } = req.body;
  
  // Word lists for scoring (could be expanded or moved to config)
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'fast', 'awesome', 'beautiful', 'recommend', 'best', 'wonderful'];
  const negativeWords = ['bad', 'poor', 'terrible', 'disappointed', 'slow', 'broken', 'worst', 'horrible', 'waste', 'defective'];
  
  // Normalize to lowercase for case-insensitive matching
  const lowerReview = review.toLowerCase();
  let score = 0;
  
  // Score calculation: +10 per positive word, -10 per negative word
  positiveWords.forEach(word => { if (lowerReview.includes(word)) score += 10; });
  negativeWords.forEach(word => { if (lowerReview.includes(word)) score -= 10; });
  
  // Classify sentiment based on threshold (tunable)
  const sentiment = score > 15 ? 'positive' : score < -15 ? 'negative' : 'neutral';
  
  // Convert score to confidence percentage (capped at 100%)
  const confidence = Math.min(100, Math.abs(score) * 3 + 50);
  
  // Return analysis results
  res.json({ sentiment, confidence: Math.floor(confidence), score });
});
  // ============================================================
  // SALES ANALYSIS ENDPOINT - COMPREHENSIVE BUSINESS ANALYTICS
  // ============================================================
  // This endpoint generates all the data needed for the admin dashboard
  // It requires admin authentication (JWT token with type "admin")
  // Returns: Monthly trends, top products, customer behavior, inventory alerts
  // ============================================================
  app.get("/api/ai/sales-analysis", authenticateAdmin, async (req, res) => {
    try {
      
      // ============================================================
      // QUERY 1: MONTHLY SALES TREND (LAST 6 MONTHS)
      // ============================================================
      // Purpose: Generate month-by-month sales data for trend charts
      // Groups orders by month, counts orders and sums revenue
      // Uses COALESCE to return 0 instead of NULL for months with no sales
      // ============================================================
      const [monthlySales] = await pool.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,  -- Format timestamp to "YYYY-MM" (e.g., "2026-05")
          COUNT(*) as order_count,                      -- Count total orders placed that month
          COALESCE(SUM(total_amount), 0) as total_revenue  -- Sum all revenue, default to 0 if no orders
        FROM orders 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)  -- Only look at last 6 months from today
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')              -- Group results by month
        ORDER BY month DESC                                     -- Most recent month first
      `);
      
      // ============================================================
      // QUERY 2: TOP 5 BEST-SELLING PRODUCTS
      // ============================================================
      // Purpose: Identify star performers by quantity sold
      // Uses LEFT JOIN to include products that have never been ordered
      // COALESCE ensures never-ordered products show 0 instead of NULL
      // ============================================================
      const [topProducts] = await pool.query(`
        SELECT 
          p.name,                                          -- Product name for display
          COALESCE(SUM(oi.quantity), 0) as total_sold,     -- Total units sold (default 0 if none)
          COALESCE(SUM(oi.subtotal), 0) as total_revenue   -- Total money made from this product
        FROM products p 
        LEFT JOIN order_items oi ON p.id = oi.product_id   -- Include ALL products, even ones never ordered
        GROUP BY p.id                                       -- Group by each unique product
        ORDER BY total_sold DESC                            -- Sort by most sold first
        LIMIT 5                                             -- Only return top 5 performers
      `);

      // ============================================================
      // QUERY 3: BEST PERFORMING DAY OF THE WEEK
      // ============================================================
      // Purpose: Discover which day customers order the most
      // DAYNAME converts date to "Monday", "Tuesday", etc.
      // Orders by count of orders, not revenue (more orders = busier day)
      // ============================================================
      const [bestDay] = await pool.query(`
        SELECT 
          DAYNAME(created_at) as day,                       -- Convert date to day name (Monday, Tuesday, etc.)
          COALESCE(SUM(total_amount), 0) as revenue         -- Total revenue generated on this day
        FROM orders
        GROUP BY DAYNAME(created_at)                        -- Group all orders by day of week
        ORDER BY COUNT(*) DESC                              -- Find day with MOST orders (busiest day)
        LIMIT 1                                             -- Only return the #1 best day
      `);

      // ============================================================
      // QUERY 4: CUSTOMER RETENTION RATE
      // ============================================================
      // Purpose: Calculate what percentage of customers come back
      // This is a NESTED QUERY (subquery) with two levels:
      //   Inner: Count orders per customer
      //   Outer: Calculate percentage of customers with multiple orders
      // NULLIF prevents division by zero if no customers exist
      // ============================================================
      const [retention] = await pool.query(`
        SELECT 
          ROUND(                                                    -- Round to 1 decimal place
            COUNT(DISTINCT                                         -- Count unique customers who...
              CASE WHEN order_count > 1 THEN customer_id END       -- ...have placed more than 1 order
            ) * 100.0                                              -- Convert to percentage
            / 
            NULLIF(COUNT(DISTINCT customer_id), 0)                 -- Divide by total unique customers (NULLIF prevents ÷0)
          , 1) as rate                                             -- 1 decimal place precision
        FROM (
          -- INNER SUBQUERY: Count how many orders each customer has placed
          SELECT 
            customer_id,                  -- Each unique customer
            COUNT(*) as order_count       -- How many orders they've placed
          FROM orders
          GROUP BY customer_id            -- One row per customer
        ) as customer_orders              -- Alias for the subquery result
      `);

      // ============================================================
      // QUERY 5: LOW STOCK ALERTS
      // ============================================================
      // Purpose: Flag products running dangerously low on inventory
      // Threshold: Less than 5 units remaining
      // Used for urgent restocking notifications
      // ============================================================
      const [lowStock] = await pool.query(`
        SELECT 
          name,          -- Product name for the alert
          quantity       -- Current stock level (how many left)
        FROM products 
        WHERE quantity < 5  -- Only products with less than 5 units
      `);

      // ============================================================
      // QUERY 6: AVERAGE DAILY REVENUE (LAST 30 DAYS)
      // ============================================================
      // Purpose: Calculate baseline daily earnings for projections
      // Divides total revenue by 30 (not actual days with orders)
      // This gives a true daily average including days with no sales
      // ============================================================
      const [avgDaily] = await pool.query(`
        SELECT 
          ROUND(                                        -- Round to 2 decimal places
            COALESCE(                                   -- Handle NULL (no orders case)
              SUM(total_amount) / 30                    -- Total revenue ÷ 30 days = daily average
            , 0)                                        -- Default to 0 if no revenue
          , 2) as avg                                   -- 2 decimal precision (e.g., 416.67)
        FROM orders 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)  -- Only last 30 days of data
      `);

      // ============================================================
      // QUERY 7: SALES BY PRODUCT CATEGORY
      // ============================================================
      // Purpose: Group products into categories and show performance
      // Uses CASE statement for smart categorization based on keywords
      // Products without matching keywords go to "Other" category
      // This helps understand which product types drive the most business
      // ============================================================
      const [categorySales] = await pool.query(`
        SELECT 
          CASE                                                  -- Smart categorization logic
            WHEN p.name LIKE '%laptop%' THEN 'Laptops'          -- Name contains "laptop"
            WHEN p.name LIKE '%phone%' OR p.name LIKE '%iphone%' THEN 'Phones'  -- Contains "phone" or "iphone"
            WHEN p.name LIKE '%watch%' THEN 'Watches'           -- Name contains "watch"
            WHEN p.name LIKE '%headphone%' OR p.name LIKE '%airpod%' THEN 'Audio'  -- Audio products
            ELSE 'Other'                                        -- Everything else grouped as "Other"
          END as name,                                          -- The calculated category name
          COALESCE(SUM(oi.quantity), 0) as sold,                -- Total units sold in this category
          COALESCE(SUM(oi.subtotal), 0) as revenue              -- Total revenue from this category
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id        -- Include all products even if never ordered
        GROUP BY name                                            -- Group by the calculated category name
      `);

      // ============================================================
      // CALCULATE GRAND TOTALS FROM MONTHLY DATA
      // ============================================================
      // Sum up all monthly order counts into a single total
      // reduce() loops through each month and adds up the values
      // Starting value is 0 for both calculations
      // ============================================================
      const totalOrders = monthlySales.reduce((sum, m) => sum + m.order_count, 0);     // Total orders across all months
      const totalRevenue = monthlySales.reduce((sum, m) => sum + parseFloat(m.total_revenue), 0);  // Total revenue across all months
      
      // ============================================================
      // SEND COMPLETE ANALYTICS RESPONSE
      // ============================================================
      // Combines all 7 queries + calculated totals into one response
      // Uses optional chaining (?.) for safety if queries return empty
      // Provides default values ("N/A", 0) if data is missing
      // ============================================================
      res.json({
        monthlySales,              // Array: Month-by-month sales data for trend charts
        topProducts,               // Array: Top 5 bestselling products
        totalOrders,               // Number: Grand total of all orders
        totalRevenue,              // Number: Grand total of all revenue
        categorySales,             // Array: Sales broken down by product category
        analytics: {               // Object: Key performance indicators and alerts
          bestDay: bestDay[0]?.day || "N/A",                    // String: Best performing day (e.g., "Saturday")
          bestDayRevenue: bestDay[0]?.revenue || 0,              // Number: Revenue on that best day
          returningCustomerRate: retention[0]?.rate || 0,        // Number: Percentage of customers who return
          avgDailyRevenue: avgDaily[0]?.avg || 0,                // Number: Average daily revenue benchmark
          lowStock: lowStock                                     // Array: Products that need restocking urgently
        }
      });
      
    } catch (error) { 
      // ============================================================
      // ERROR HANDLING
      // ============================================================
      // Log the full error for debugging on the server
      // Send generic error message to client (don't expose internals)
      // ============================================================
      console.error("Sales analysis error:", error);
      res.status(500).json({ message: "Analysis error" }); 
    }
  });
  // ============================================================
  // DEMAND FORECASTING ENDPOINT - PREDICT FUTURE INVENTORY NEEDS
  // ============================================================
  // This endpoint analyzes historical sales to predict future demand
  // Helps admins make data-driven inventory decisions
  // Uses basic statistical forecasting based on past sales volume
  // ============================================================
  app.get("/api/ai/forecast", authenticateAdmin, async (req, res) => {
    try {
      // ============================================================
      // QUERY: GET TOP 10 PRODUCTS BY TOTAL UNITS SOLD
      // ============================================================
      // Retrieves products with their historical sales data
      // Uses LEFT JOIN to include products that have never been ordered
      // COALESCE converts NULL to 0 for products with no sales
      // ============================================================
      const [orders] = await pool.query(`
        SELECT 
          p.id,                                          -- Product ID for identification
          p.name,                                        -- Product name for display
          COALESCE(SUM(oi.quantity), 0) as total_sold    -- Total units ever sold (0 if never sold)
        FROM products p 
        LEFT JOIN order_items oi ON p.id = oi.product_id -- Include ALL products, not just sold ones
        GROUP BY p.id                                     -- Group sales by each product
        ORDER BY total_sold DESC                          -- Most sold products first
        LIMIT 10                                          -- Only analyze top 10 products
      `);
      
      // ============================================================
      // GENERATE FORECAST METRICS FOR EACH PRODUCT
      // ============================================================
      // Transforms raw sales data into actionable predictions
      // Uses simple linear scaling for demonstration purposes
      // In production, you'd use ML models or time-series analysis
      // ============================================================
      const forecasts = orders.map(product => ({
        ...product,  // Spread original product data (id, name, total_sold)
        
        // FORECAST SCORE: Confidence level from 0-100
        // Higher sales = higher confidence in prediction
        // Formula: (sales × 5) + 20, capped at 100
        // Example: 10 sales → (10×5)+20 = 70% confidence
        forecast_score: Math.min(100, Math.floor(product.total_sold * 5 + 20)),
        
        // TREND INDICATOR: Visual representation of demand level
        // High Demand: 20+ units sold (hot product, keep stocking)
        // Steady: 5-20 units sold (consistent seller)
        // Low: Less than 5 units sold (slow mover)
        trend: product.total_sold > 20 ? "📈 High Demand" : 
              product.total_sold > 5 ? "📊 Steady" : 
              "📉 Low",
        
        // RECOMMENDED STOCK: How many units to keep in inventory
        // Based on 1.5× historical sales with minimum of 8 units
        // Example: 10 sales → max(8, floor(10×1.5)) = 15 units
        recommended_stock: Math.max(8, Math.floor(product.total_sold * 1.5))
      }));
      
      // Return complete forecast data to admin dashboard
      res.json(forecasts);
      
    } catch (error) { 
      // Log the full error server-side for debugging
      console.error("Forecast error:", error);
      // Send user-friendly error message to client
      res.status(500).json({ message: "Forecast error" }); 
    }
  });

  // ============================================================
  // PRODUCT DESCRIPTION GENERATOR
  // ============================================================
  // Creates marketing descriptions for new products
  // Simple template-based generation (could be upgraded to AI)
  // ============================================================
  app.post("/api/ai/generate-description", authenticateAdmin, async (req, res) => {
    const { productName, price } = req.body;  // Extract product details from request
    
    // ============================================================
    // TEMPLATE-BASED DESCRIPTION GENERATION
    // ============================================================
    // Uses template literals to inject product name and price
    // Includes emojis and marketing language for appeal
    // In production, this could call GPT/Groq for better results
    // ============================================================
    let description = `✨ The ${productName} is a premium product priced at $${price}. ✅ Shop now at Smartify LB for the best deals! ✅ Fast delivery ✅ Quality guaranteed.`;
    
    // Return the generated description
    res.json({ description });
  });

  // ============================================================
  // SIMPLE RULE-BASED CHATBOT
  // ============================================================
  // Provides instant answers to common customer questions
  // No AI required - uses keyword matching for fast responses
  // Falls back to generic response if no keywords match
  // ============================================================
  app.post("/api/chatbot", async (req, res) => {
    const { message } = req.body;  // Get user's message
    
    // Handle empty messages with a friendly greeting
    if (!message) return res.json({ reply: "Hello! How can I help you today?" });
    
    // Convert message to lowercase for case-insensitive matching
    const msg = message.toLowerCase();
    let reply = "";  // Will store the bot's response
    
    // ============================================================
    // KEYWORD MATCHING LOGIC
    // ============================================================
    // Checks for specific keywords in the user's message
    // First matching condition wins (order matters)
    // Each response is crafted to be helpful and friendly
    // ============================================================
    
    // Shipping-related queries
    if (msg.includes('shipping')) 
      reply = "🚚 Express delivery (2-3 days) for $3.00. Free shipping on orders over $500!";
    
    // Greeting detection
    else if (msg.includes('hello') || msg.includes('hi')) 
      reply = "👋 Hello! Welcome to Smartify LB! How can I help you?";
    
    // Product inquiries
    else if (msg.includes('product') || msg.includes('recommend')) 
      reply = "🛍️ Check out our latest products! Laptops, phones, smartwatches, and more!";
    
    // Sale/discount questions
    else if (msg.includes('sale')) 
      reply = "🏷️ Yes! Products on sale have the SALE badge. Check the Products page!";
    
    // Default fallback response when no keywords match
    else 
      reply = "💡 Thanks for your message! Check our Products page or contact support@smartify.com";
    
    // Return the bot's reply
    res.json({ reply });
  });

  // ============================================================
  // AI SERVICE STATUS CHECK
  // ============================================================
  // Lets the frontend know if Groq AI is available
  // Used to show/hide AI features in the UI
  // ============================================================
  app.get("/api/ai/status", (req, res) => {
    res.json({ 
      status: groq ? 'online' : 'offline',           // Is Groq AI connected?
      model: groq ? 'llama3-8b-8192' : 'none',       // Which AI model is active?
      callsThisMinute: 0                               // Rate limit tracking
    });
  });

    // ============================================================
  // ADVANCED AI CHAT ENDPOINT - DATABASE FIRST, THEN GROQ AI
  // ============================================================
  app.post("/api/ai/chat", async (req, res) => {
    const { message, history, customerId } = req.body;
    
    if (!message || message.trim() === '') {
      return res.json({ reply: "👋 Hello! How can I help you today?" });
    }
    
    const msg = message.toLowerCase();
    
 // ============================================================
// STEP 1: CHECK DATABASE FIRST
// This section handles all database-related operations before
// falling back to AI/NLP processing
// ============================================================

// ADD TO FAVORITES - Check FIRST
// Handles adding products to user's favorites list
// Triggers on keywords like 'add', 'favorite', 'save', 'wishlist'
if (customerId && msg.includes('add') && (msg.includes('favorite') || msg.includes('favourites') || msg.includes('save') || msg.includes('wishlist'))) {
  try {
    // Fetch all available products from the database
    const [allProducts] = await pool.query(`SELECT id, name, price, quantity FROM products WHERE quantity > 0`);
    let matchedProduct = null;
    
    // First attempt: Match product by exact name substring in the message
    for (const p of allProducts) {
      if (message.toLowerCase().includes(p.name.toLowerCase())) {
        matchedProduct = p;
        break;
      }
    }
    
    // Second attempt: If no exact match, try matching individual words
    // This helps with partial or typo'd product names
    if (!matchedProduct) {
      const words = message.toLowerCase().split(' ');
      for (const p of allProducts) {
        for (const word of words) {
          // Only consider words longer than 2 characters to avoid false matches
          if (word.length > 2 && p.name.toLowerCase().includes(word)) {
            matchedProduct = p;
            break;
          }
        }
        if (matchedProduct) break;
      }
    }
    
    // If a product was successfully matched
    if (matchedProduct) {
      // Check if product is already in favorites to prevent duplicates
      const [existing] = await pool.query("SELECT id FROM favorites WHERE customer_id = ? AND product_id = ?", [customerId, matchedProduct.id]);
      if (existing.length > 0) {
        return res.json({ reply: `❤️ ${matchedProduct.name} is already in your favorites!`, source: 'database' });
      }
      // Add the product to favorites
      await pool.query("INSERT INTO favorites (customer_id, product_id) VALUES (?, ?)", [customerId, matchedProduct.id]);
      return res.json({ reply: `❤️ **${matchedProduct.name}** added to your favorites!`, source: 'database' });
    } else {
      // No matching product found - show available products (limited to first 5)
      const names = allProducts.slice(0, 5).map(p => p.name).join(', ');
      return res.json({ reply: `I couldn't find that product. Available: ${names}`, source: 'database' });
    }
  } catch (err) { console.error('Add to favorites error:', err); }
}

// FAVORITES - Show favorites (only if NOT adding)
// Displays the user's saved favorites list
// Only triggers when NOT trying to add new items (to prevent conflict)
if (customerId && !msg.includes('add') && (msg.includes('favorite') || msg.includes('saved') || msg.includes('my liked') || msg.includes('show fav'))) {
  try {
    // Join favorites table with products to get full product details
    const [favorites] = await pool.query(
      `SELECT f.id, p.name, p.price, p.image 
       FROM favorites f JOIN products p ON f.product_id = p.id 
       WHERE f.customer_id = ?`, [customerId]
    );
    
    if (favorites.length > 0) {
      // Format the favorites list with bullet points and prices
      const list = favorites.map(f => `• ${f.name} - $${f.price}`).join('\n');
      return res.json({ reply: `❤️ **Your Favorites (${favorites.length}):**\n\n${list}`, source: 'database' });
    } else {
      // Guide the user on how to add favorites if they have none
      return res.json({ reply: "You don't have any favorites yet. Say 'add laptop to favorites' to save one!", source: 'database' });
    }
  } catch (err) { console.error('Favorites error:', err); }
}

// ADD TO CART - Check FIRST (must be before CART check)
// Handles adding products to user's shopping cart
// Similar pattern to favorites but with quantity management
if (customerId && msg.includes('add') && (msg.includes('cart') || msg.includes('to cart') || msg.includes('to my cart'))) {
  try {
    // Fetch all in-stock products
    const [allProducts] = await pool.query(`SELECT id, name, price, quantity FROM products WHERE quantity > 0`);
    let matchedProduct = null;
    
    // First attempt: Exact name matching
    for (const p of allProducts) {
      if (message.toLowerCase().includes(p.name.toLowerCase())) {
        matchedProduct = p;
        break;
      }
    }
    
    // Second attempt: Word-by-word matching for flexibility
    if (!matchedProduct) {
      const words = message.toLowerCase().split(' ');
      for (const p of allProducts) {
        for (const word of words) {
          if (word.length > 2 && p.name.toLowerCase().includes(word)) {
            matchedProduct = p;
            break;
          }
        }
        if (matchedProduct) break;
      }
    }
    
    if (matchedProduct) {
      // Check inventory - don't add if out of stock
      if (matchedProduct.quantity < 1) {
        return res.json({ reply: `Sorry, ${matchedProduct.name} is out of stock.`, source: 'database' });
      }
      
      // Check if product already exists in cart
      const [existing] = await pool.query("SELECT id, quantity FROM cart WHERE customer_id = ? AND product_id = ?", [customerId, matchedProduct.id]);
      if (existing.length > 0) {
        // Update quantity if already in cart (increment by 1)
        await pool.query("UPDATE cart SET quantity = quantity + 1 WHERE customer_id = ? AND product_id = ?", [customerId, matchedProduct.id]);
      } else {
        // Insert new cart item with quantity 1
        await pool.query("INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, 1)", [customerId, matchedProduct.id]);
      }
      return res.json({ reply: `✅ **${matchedProduct.name}** added to your cart! Price: $${matchedProduct.price}`, source: 'database' });
    } else {
      // No match found - show available products
      const names = allProducts.slice(0, 5).map(p => p.name).join(', ');
      return res.json({ reply: `I couldn't find that product. Available: ${names}`, source: 'database' });
    }
  } catch (err) { console.error('Add to cart error:', err); }
}

// CART - Check SECOND (only show cart, not add)
// Displays the user's current shopping cart contents
// Important: Only triggers when NOT trying to add items
if (customerId && !msg.includes('add') && (msg.includes('my cart') || msg.includes('show cart'))) {
  try {
    // Join cart with products to get full details and calculate totals
    const [cart] = await pool.query(
      `SELECT c.quantity, p.name, p.price 
       FROM cart c JOIN products p ON c.product_id = p.id 
       WHERE c.customer_id = ?`, [customerId]
    );
    
    if (cart.length > 0) {
      // Format cart items with quantities and prices
      const list = cart.map(c => `• ${c.name} x${c.quantity} - $${c.price}`).join('\n');
      // Calculate total cost
      const total = cart.reduce((s, c) => s + (c.price * c.quantity), 0);
      return res.json({ reply: `🛒 **Your Cart:**\n\n${list}\n\n💰 Total: $${total.toFixed(2)}`, source: 'database' });
    } else {
      return res.json({ reply: "Your cart is empty.", source: 'database' });
    }
  } catch (err) { console.error('Cart error:', err); }
}

// ORDERS
// Displays order history and tracking information
// Triggers on order-related keywords like 'my order', 'track', 'where is my'
if (customerId && (msg.includes('my order') || msg.includes('track') || msg.includes('where is my'))) {
  try {
    // Fetch last 5 orders for the customer, ordered by most recent
    const [orders] = await pool.query(
      `SELECT order_number, order_status, total_amount FROM orders 
       WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5`, [customerId]
    );
    
    if (orders.length > 0) {
      // Display order list with status and amounts
      const list = orders.map(o => `• ${o.order_number} - ${o.order_status} - $${o.total_amount}`).join('\n');
      return res.json({ reply: `📋 **Your Orders:**\n\n${list}`, source: 'database' });
    } else {
      return res.json({ reply: "No orders yet.", source: 'database' });
    }
  } catch (err) { console.error('Orders error:', err); }
}
   
      
    
    // ============================================================
    // STEP 2: GROQ AI FOR GENERAL CONVERSATION
    // ============================================================
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are SmartAI for Smartify LB in Lebanon. Be helpful and friendly." },
            { role: "user", content: message }
          ],
          max_tokens: 300
        });
        return res.json({ reply: completion.choices[0].message.content, source: 'groq-ai' });
      } catch (err) { console.error('Groq error:', err.message); }
    }
    
    // FALLBACK
    res.json({ reply: "I can help with products, orders, shipping, and returns.", source: 'fallback' });
  });
  // ============================================================
  // PASSWORD RESET SYSTEM
  // ============================================================
  // Complete password recovery flow with email verification
  // Uses time-limited tokens to prevent abuse
  // 3-step process: Request → Verify → Reset
  // ============================================================

  // ============================================================
  // HELPER: Generate random 6-digit verification code
  // ============================================================
  // Creates codes like "483921" for email verification
  // Uses Math.random() for simplicity (crypto.randomBytes for production)
  // ============================================================
  const generateCode = () => {
    // Generate number between 100000 and 999999, convert to string
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ============================================================
  // HELPER: Generate cryptographically secure random token
  // ============================================================
  // Creates 64-character hex string for secure password reset links
  // Uses crypto.randomBytes for true randomness (not Math.random)
  // ============================================================
  const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');  // 32 bytes → 64 hex characters
  };

  // ============================================================
  // STEP 1: FORGOT PASSWORD - REQUEST RESET
  // ============================================================
  // User enters their email to receive a reset code
  // Doesn't reveal if email exists (security best practice)
  // But current implementation does reveal it (consider changing)
  // ============================================================
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;  // Get email from request body
    
    // Validate that email was provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    try {
      // ============================================================
      // FIND CUSTOMER BY EMAIL
      // ============================================================
      // Only active customers can reset passwords
      // Also retrieves phone for potential SMS notification
      // ============================================================
      const [customers] = await pool.query(
        "SELECT id, first_name, phone FROM customers WHERE email = ? AND is_active = 1",
        [email.toLowerCase()]  // Case-insensitive email lookup
      );
      
      // If no customer found with this email
      if (customers.length === 0) {
        return res.status(404).json({ message: "No account found with this email" });
      }
      
      const customer = customers[0];
      
      // ============================================================
      // GENERATE RESET CREDENTIALS
      // ============================================================
      // Code: 6-digit number for manual entry
      // Token: 64-char hex string for secure links
      // Expiry: 10 minutes from now to prevent stale tokens
      // ============================================================
      const code = generateCode();                                        // e.g., "483921"
      const token = generateToken();                                      // e.g., "a1b2c3...64 chars"
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);           // 10 minutes = 600,000ms
      
      // ============================================================
      // CLEAN UP OLD TOKENS & STORE NEW ONE
      // ============================================================
      // Delete any existing unused reset tokens for this email
      // This prevents multiple valid tokens from existing
      // Then insert the new token with expiry time
      // ============================================================
      await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
      await pool.query(
        "INSERT INTO password_resets (email, reset_code, reset_token, expires_at) VALUES (?, ?, ?, ?)",
        [email, code, token, expiresAt]
      );
      
      // ============================================================
      // SEND RESET CODE VIA EMAIL
      // ============================================================
      // Beautiful HTML email with the reset code prominently displayed
      // Includes customer's name for personalization
      // Clear expiry warning for security
      // ============================================================
      const mailOptions = {
        from: `"Smartify LB" <${process.env.EMAIL_USER}>`,  // Sender display name
        to: email,                                            // Recipient
        subject: '🔐 Password Reset Code - Smartify LB',     // Email subject with emoji
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #667eea;">Password Reset Code</h2>
            <p>Hello ${customer.first_name},</p>
            <p>You requested to reset your password. Here is your verification code:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</span>
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      };
      
      // Send the email
      await transporter.sendMail(mailOptions);
      
      // ============================================================
      // RETURN SUCCESS RESPONSE
      // ============================================================
      // Includes the reset token for frontend to use in next steps
      // expiresIn: 600 seconds = 10 minutes
      // ============================================================
      res.json({ 
        success: true, 
        message: "Reset code sent to your email",
        resetToken: token,     // For secure link verification
        expiresIn: 600         // 10 minutes in seconds (for countdown timer)
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  // ============================================================
  // STEP 2: VERIFY RESET CODE
  // ============================================================
  // User enters the 6-digit code they received via email
  // Validates the code is correct and not expired
  // Returns the reset token for the final step
  // ============================================================
  app.post("/api/verify-reset-code", async (req, res) => {
    const { email, code } = req.body;  // Get email and 6-digit code
    
    // Validate both fields are provided
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }
    
    try {
      // ============================================================
      // FIND MATCHING NON-EXPIRED RESET RECORD
      // ============================================================
      // Checks THREE conditions simultaneously:
      // 1. Email matches
      // 2. Code matches
      // 3. Token hasn't expired (expires_at > current time)
      // ============================================================
      const [rows] = await pool.query(
        "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expires_at > NOW()",
        [email, code]
      );
      
      // If no matching record found (wrong code or expired)
      if (rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired code" 
        });
      }
      
      // ============================================================
      // RETURN THE SECURE RESET TOKEN
      // ============================================================
      // This token will be used in the final password reset step
      // Token is more secure than the code for the actual password change
      // ============================================================
      res.json({ 
        success: true, 
        message: "Code verified successfully",
        resetToken: rows[0].reset_token  // The 64-character secure token
      });
      
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============================================================
  // STEP 3: RESET PASSWORD
  // ============================================================
  // Final step - user enters new password with the verified token
  // Multiple security checks before updating password
  // Cleans up used tokens after successful reset
  // ============================================================
  app.post("/api/reset-password", async (req, res) => {
    const { resetToken, newPassword, confirmPassword } = req.body;  // Extract all fields
    
    // ============================================================
    // VALIDATION CHECKS
    // ============================================================
    
    // Check all fields are provided
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check passwords match (prevents typos)
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    
    // Enforce minimum password length for security
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    try {
      // ============================================================
      // VERIFY RESET TOKEN
      // ============================================================
      // Check the token exists and hasn't expired
      // This prevents use of old or fake tokens
      // ============================================================
      const [rows] = await pool.query(
        "SELECT * FROM password_resets WHERE reset_token = ? AND expires_at > NOW()",
        [resetToken]
      );
      
      // Invalid or expired token
      if (rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired token" 
        });
      }
      
      // ============================================================
      // UPDATE PASSWORD
      // ============================================================
      // Get email from the verified reset record
      // Hash the new password with bcrypt (same as signup)
      // Update the customer's password in database
      // ============================================================
      const email = rows[0].email;                           // Extract email from reset record
      const hashedPassword = await bcrypt.hash(newPassword, 10);  // Hash with 10 salt rounds
      
      // Update the customer's password
      await pool.query(
        "UPDATE customers SET password = ? WHERE email = ?",
        [hashedPassword, email]
      );
      
      // ============================================================
      // CLEAN UP
      // ============================================================
      // Delete the used reset token (can't be used again)
      // This is a security best practice to prevent token reuse
      // ============================================================
      await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
      
      // Return success
      res.json({ 
        success: true, 
        message: "Password reset successfully! You can now login with your new password." 
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============================================================
  // WHATSAPP TEST ENDPOINT
  // ============================================================
  // Simple endpoint to test if WhatsApp messaging works
  // Can be called from frontend or Postman for debugging
  // ============================================================
  app.post("/api/test-email", async (req, res) => {
    const { email } = req.body;
    try {
        await emailNotifications.sendWelcomeEmail(email || process.env.EMAIL_USER, "Test User");
        res.json({ success: true, message: "Test email sent!" });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

  // ============================================================
  // IMAGE UPLOAD SYSTEM FOR ADMIN PRODUCT MANAGEMENT
  // ============================================================
  // Handles product image uploads with validation
  // Uses multer for multipart form data processing
  // Stores images in public/uploads/products directory
  // ============================================================

  // Import required modules for file handling
  const multer = require('multer');  // Handles multipart/form-data (file uploads)
  const fs = require('fs');          // File system operations (create directories)

  // ============================================================
  // CREATE UPLOAD DIRECTORIES IF THEY DON'T EXIST
  // ============================================================
  // Uses recursive: true to create parent directories too
  // __dirname is the current directory (where server.js is)
  // ============================================================
  const uploadDir = path.join(__dirname, 'public', 'uploads');     // Base upload directory
  const productsDir = path.join(uploadDir, 'products');             // Product images subdirectory

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });  // Create base directory
  }
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true }); // Create products subdirectory
  }

  // ============================================================
  // CONFIGURE MULTER STORAGE
  // ============================================================
  // Defines WHERE and HOW files are saved
  // diskStorage saves files to the server's hard drive
  // ============================================================
  const storage = multer.diskStorage({
    // DESTINATION: Which folder to save the uploaded file
    destination: function (req, file, cb) {
      cb(null, productsDir);  // Save to public/uploads/products
    },
    
    // FILENAME: How to name the saved file
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);  // e.g., "1716480000-123456789"
      const ext = path.extname(file.originalname);                               // e.g., ".jpg"
      cb(null, 'product-' + uniqueSuffix + ext);                                 // e.g., "product-1716480000-123456789.jpg"
    }
  });

  // ============================================================
  // FILE TYPE VALIDATION
  // ============================================================
  // Only allow common image formats
  // Checks both file extension AND MIME type for security
  // ============================================================
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;  // Allowed extensions
    
    // Check file extension
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    
    // Check MIME type (more reliable than extension)
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);  // File is valid, accept it
    } else {
      cb(new Error('Only image files are allowed'));  // Reject non-image files
    }
  };

  // ============================================================
  // CREATE MULTER INSTANCE WITH CONFIGURATION
  // ============================================================
  // Combines storage, file size limit, and file filter
  // 5MB max file size prevents server overload
  // ============================================================
  const upload = multer({ 
    storage: storage,                            // Where and how to save
    limits: { fileSize: 5 * 1024 * 1024 },      // 5MB = 5 * 1024 * 1024 bytes
    fileFilter: fileFilter                       // Only images allowed
  });

  // ============================================================
  // IMAGE UPLOAD ENDPOINT (ADMIN ONLY)
  // ============================================================
  // Accepts single image file with field name "image"
  // Returns the URL where the image can be accessed
  // ============================================================
  app.post("/api/admin/upload-image", authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
      // Check if file was actually uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // ============================================================
      // GENERATE ACCESSIBLE IMAGE URL
      // ============================================================
      // Constructs the full URL where the image can be accessed
      // Uses localhost:5000 as the base (change for production)
      // ============================================================
      const imageUrl = `http://localhost:5000/uploads/products/${req.file.filename}`;
      
      // Return success with the image URL and filename
      res.json({ 
        success: true, 
        imageUrl: imageUrl,           // Full URL to access the image
        filename: req.file.filename   // Just the filename for reference
      });
      
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // ============================================================
  // SERVE UPLOADED FILES STATICALLY
  // ============================================================
  // Makes uploaded images accessible via HTTP
  // Example: http://localhost:5000/uploads/products/image.jpg
  // ============================================================
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // ============================================================
  // CONTACT FORM ENDPOINT
  // ============================================================
  // Processes contact form submissions from the website
  // Sends notification emails to both admin and customer
  // Optionally sends WhatsApp confirmation (if service is ready)
  // No database storage needed (emails serve as records)
  // ============================================================
  app.post("/api/contact", async (req, res) => {
    const { name, email, phone, subject, message, category, userId } = req.body;
    
    // ============================================================
    // VALIDATE REQUIRED FIELDS
    // ============================================================
    // Name, email, subject, and message are mandatory
    // Phone and category are optional
    // ============================================================
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill in all required fields" 
      });
    }
    
    try {
      // Database save skipped - contact_messages table not needed
      // Emails and WhatsApp are the primary notification methods
      
      // ============================================================
      // SEND NOTIFICATION TO ADMIN
      // ============================================================
      // Admin receives an email with all contact details
      // Styled with gradient header for professional look
      // ============================================================
      const adminMailOptions = {
        from: `"Smartify LB Contact" <${process.env.EMAIL_USER}>`,
        to: "alaa.alsayed003@gmail.com",  // Admin email address
        subject: `📩 New Contact: ${subject} (${category || 'general'})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">📩 New Contact Message</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <div style="margin-top: 15px; padding: 15px; background: white; border-left: 4px solid #667eea;">
                <p>${message}</p>
              </div>
            </div>
          </div>
        `
      };
      
      // Send admin notification email
      await transporter.sendMail(adminMailOptions);
      
      // ============================================================
      // SEND CONFIRMATION TO CUSTOMER
      // ============================================================
      // Customer receives an acknowledgment email
      // Green gradient header for positive confirmation feel
      // Reassures them their message was received
      // ============================================================
      const customerMailOptions = {
        from: `"Smartify LB Support" <${process.env.EMAIL_USER}>`,
        to: email,  // Send to the customer's email
        subject: '✅ We received your message - Smartify LB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">✅ Message Received!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for contacting <strong>Smartify LB</strong>! We'll get back to you within 24 hours.</p>
              <hr>
              <p style="color: #999; font-size: 12px;">Best regards,<br>Smartify LB Team<br>Tyre, Lebanon</p>
            </div>
          </div>
        `
      };
      
      // Send customer confirmation email
      await transporter.sendMail(customerMailOptions);
      
      // ============================================================
      // WHATSAPP NOTIFICATION (OPTIONAL)
      // ============================================================
      // Only sends if: phone number provided AND WhatsApp service is ready
      // Silent failure if WhatsApp isn't ready (doesn't affect user experience)
      // ============================================================
     if (phone) {
  console.log(`📱 Phone number provided: ${phone} - Email confirmation sent instead`);
}
      
      // ============================================================
      // RETURN SUCCESS
      // ============================================================
      // User sees success message on the contact form
      // ============================================================
      res.json({
        success: true,
        message: "✅ Message sent successfully!"
      });
      
    } catch (error) {
      // ============================================================
      // ERROR HANDLING
      // ============================================================
      // Most likely email sending failed
      // Log full error for debugging, send friendly message to user
      // ============================================================
      console.error("Contact form error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later."
      });
    }
  });

  // ============================================================
  // GLOBAL ERROR HANDLING MIDDLEWARE
  // ============================================================

  // ============================================================
  // 404 HANDLER - CATCH UNDEFINED ROUTES
  // ============================================================
  // This runs when no other route matches the request
  // Returns JSON instead of HTML for API consistency
  // ============================================================
  app.use((req, res) => { 
    res.status(404).json({ message: "Route not found" }); 
  });

  // ============================================================
  // GLOBAL ERROR HANDLER
  // ============================================================
  // Catches any unhandled errors that bubble up
  // Prevents server crashes from unexpected errors
  // Logs error for debugging, sends generic message to client
  // ============================================================
  app.use((err, req, res, next) => { 
    console.error("Unhandled error:", err);  // Full error in server logs
    res.status(500).json({ message: "Internal server error" });  // Safe message to client
  });

  // ============================================================
  // START THE SERVER
  // ============================================================
  // Listens on the configured port (default 5000)
  // Prints all available endpoints for easy reference
  // Shows status of AI and other services
  // ============================================================
  const PORT = process.env.PORT || 5000;  // Use environment variable or default to 5000
  app.listen(PORT, () => {
    console.log(`✅ Smartify API server is RUNNING on port ${PORT}`);
    console.log(`🌐 Test endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/test`);
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`  GET  http://localhost:${PORT}/api/products`);
    console.log(`  POST http://localhost:${PORT}/api/customers/signup`);
    console.log(`  POST http://localhost:${PORT}/api/customers/login`);
    console.log(`  POST http://localhost:${PORT}/api/verify-2fa-login`);
    console.log(`  POST http://localhost:${PORT}/api/admin/login`);
    console.log(`  POST http://localhost:${PORT}/api/forgot-password`);
    console.log(`\n📋 Admin login: admin@smartify.com / admin123`);
    console.log(`📱 Free WhatsApp Service: READY`);
    console.log(`🔐 2FA Email Verification: ENABLED`);
    console.log(`\n🤖 AI Chatbot Endpoints:`);
    console.log(`  POST http://localhost:${PORT}/api/chatbot        ← Simple rule-based`);
    console.log(`  POST http://localhost:${PORT}/api/ai/chat        ← Groq AI (SmartAI)`);
    
    // ============================================================
    // SHOW AI STATUS
    // ============================================================
    // Indicates whether advanced AI features are available
    // Groq connected = AI-powered chatbot active
    // Groq missing = fallback responses only
    // ============================================================
    if (groq) {
      console.log(`  ⚡ Groq AI: CONNECTED - FREE & FAST (llama3-8b)`);
    } else {
      console.log(`  ⚠️  Groq AI: NOT CONFIGURED - Using fallback responses`);
      console.log(`  💡 Run: npm install groq-sdk`);
    }
  });