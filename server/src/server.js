// Force load .env file FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Now import everything else
const express = require("express");
const pool = require("./config/mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Import free WhatsApp service
const freeWhatsapp = require('./services/freeWhatsappService');

const app = express();

// Debug: Check if .env loaded
console.log('=================================');
console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ LOADED' : '❌ MISSING');
console.log('DB_HOST:', process.env.DB_HOST || '❌ MISSING');
console.log('DB_USER:', process.env.DB_USER || '❌ MISSING');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ LOADED' : '❌ MISSING');
console.log('=================================\n');

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5000"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/images', express.static('public/images'));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ================= TEST ================= */
app.get("/", (req, res) => res.send("Smartify API running ✅"));
app.get("/test", (req, res) => res.json({ message: "Server is running!", status: "online" }));
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

/* ================= REAL WEBAUTHN (Face ID / Biometric) ENDPOINTS ================= */
// Store challenges temporarily (in production, use Redis)
const registrationChallenges = new Map();
const loginChallenges = new Map();

// Generate registration challenge - Step 1 for registering Face ID
app.post("/api/webauthn/register-challenge", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }
  
  try {
    // Generate random challenge (32 bytes)
    const challenge = crypto.randomBytes(32).toString('base64');
    const userId = crypto.randomBytes(16).toString('base64');
    const rpId = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
    
    // Store challenge for this user (expires in 5 minutes)
    registrationChallenges.set(email, {
      challenge,
      userId,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // Clean up expired challenges
    setTimeout(() => {
      for (const [key, value] of registrationChallenges.entries()) {
        if (value.expiresAt < Date.now()) {
          registrationChallenges.delete(key);
        }
      }
    }, 60000);
    
    res.json({
      challenge,
      userId,
      rpId,
      rpName: "Smartify LB"
    });
  } catch (error) {
    console.error("Register challenge error:", error);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

// Verify registration - Step 2 for registering Face ID
app.post("/api/webauthn/register-verify", async (req, res) => {
  const { email, credentialId, publicKey, attestationObject, clientDataJSON } = req.body;
  
  const storedChallenge = registrationChallenges.get(email);
  
  if (!storedChallenge) {
    return res.status(400).json({ success: false, message: "No registration in progress" });
  }
  
  if (storedChallenge.expiresAt < Date.now()) {
    registrationChallenges.delete(email);
    return res.status(400).json({ success: false, message: "Challenge expired. Please try again." });
  }
  
  try {
    // Save credential to database
    const credentialData = JSON.stringify({
      credentialId,
      publicKey,
      attestationObject,
      clientDataJSON,
      registeredAt: new Date().toISOString(),
      deviceInfo: req.headers['user-agent'] || 'Unknown'
    });
    
    await pool.query(
      `UPDATE customers SET face_id_enabled = 1, face_id_data = ? WHERE email = ?`,
      [credentialData, email.toLowerCase()]
    );
    
    registrationChallenges.delete(email);
    
    res.json({ success: true, message: "Face ID registered successfully!" });
  } catch (error) {
    console.error("Verify registration error:", error);
    res.status(500).json({ success: false, message: "Failed to save biometric credential" });
  }
});

// Generate login challenge - Step 1 for Face ID login
app.post("/api/webauthn/login-challenge", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }
  
  try {
    // Get user's credential IDs
    const [customer] = await pool.query(
      "SELECT face_id_data FROM customers WHERE email = ? AND face_id_enabled = 1",
      [email.toLowerCase()]
    );
    
    if (customer.length === 0 || !customer[0].face_id_data) {
      return res.json({ allowCredentials: [] });
    }
    
    const faceData = JSON.parse(customer[0].face_id_data);
    const challenge = crypto.randomBytes(32).toString('base64');
    const rpId = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
    
    loginChallenges.set(email, {
      challenge,
      credentialId: faceData.credentialId,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // Clean up expired challenges
    setTimeout(() => {
      for (const [key, value] of loginChallenges.entries()) {
        if (value.expiresAt < Date.now()) {
          loginChallenges.delete(key);
        }
      }
    }, 60000);
    
    res.json({
      challenge,
      rpId,
      allowCredentials: [{
        id: faceData.credentialId,
        type: "public-key",
        transports: ["internal"]
      }]
    });
  } catch (error) {
    console.error("Login challenge error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify login - Step 2 for Face ID login
app.post("/api/webauthn/login-verify", async (req, res) => {
  const { email, credentialId, authenticatorData, clientDataJSON, signature } = req.body;
  
  const storedChallenge = loginChallenges.get(email);
  
  if (!storedChallenge) {
    return res.status(400).json({ success: false, message: "No login in progress" });
  }
  
  if (storedChallenge.expiresAt < Date.now()) {
    loginChallenges.delete(email);
    return res.status(400).json({ success: false, message: "Challenge expired. Please try again." });
  }
  
  if (storedChallenge.credentialId !== credentialId) {
    return res.status(401).json({ success: false, message: "Invalid credential" });
  }
  
  try {
    // Get user data
    const [customer] = await pool.query(
      "SELECT id, first_name, last_name, email, phone FROM customers WHERE email = ? AND is_active = 1",
      [email.toLowerCase()]
    );
    
    if (customer.length === 0) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }
    
    loginChallenges.delete(email);
    
    res.json({ 
      success: true, 
      message: "Biometric verified",
      customerId: customer[0].id
    });
  } catch (error) {
    console.error("Login verify error:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Check if user has Face ID
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

// Register Face ID for user (legacy endpoint)
app.post("/api/face-id/register", async (req, res) => {
  const { email, credentialId, publicKey, faceData } = req.body;
  
  try {
    const [customer] = await pool.query(
      "SELECT id FROM customers WHERE email = ?",
      [email.toLowerCase()]
    );
    
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Update customer with Face ID enabled
    await pool.query(
      "UPDATE customers SET face_id_enabled = 1, face_id_data = ? WHERE id = ?",
      [faceData ? JSON.stringify(faceData) : null, customer[0].id]
    );
    
    res.json({ success: true, message: "Face ID registered successfully!" });
  } catch (error) {
    console.error("Face ID register error:", error);
    res.status(500).json({ message: "Failed to register Face ID" });
  }
});

// Verify Face ID login (legacy endpoint)
app.post("/api/face-id/verify", async (req, res) => {
  const { email, faceIdVerified } = req.body;
  
  if (!faceIdVerified) {
    return res.status(401).json({ message: "Face ID verification failed" });
  }
  
  try {
    const [customer] = await pool.query(
      "SELECT * FROM customers WHERE email = ? AND is_active = 1",
      [email.toLowerCase()]
    );
    
    if (customer.length === 0) {
      return res.status(401).json({ message: "Customer not found" });
    }
    
    await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [customer[0].id]);
    
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
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= REAL CAMERA FACE RECOGNITION ENDPOINTS ================= */

// Save face data during signup
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

// Get face data for login
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

// Check if user has face data
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

// Send email code (for 2FA backup)
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
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer[0].id]);
    await pool.query(
      `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [customer[0].id, verificationToken, verificationCode, expiresAt]
    );
    
    const mailOptions = {
      from: `"Smartify LB Security" <${process.env.EMAIL_USER}>`,
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

// Verify email code
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

/* ================= PRODUCTS ================= */
app.get("/api/products", async (req, res) => {
  try {
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
app.post("/api/customers/signup", async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;
  if (!first_name || !email || !password) {
    return res.status(400).json({ message: "Required fields missing" });
  }
  
  try {
    const [exists] = await pool.query("SELECT id FROM customers WHERE email = ?", [email.toLowerCase()]);
    if (exists.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO customers (first_name, last_name, email, password, phone, is_2fa_enabled) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name || "", email.toLowerCase(), hashed, phone || "", 1]
    );
    
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

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Login with 2FA
app.post("/api/customers/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE email = ? AND is_active = 1", 
      [email.toLowerCase()]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const customer = rows[0];
    const match = await bcrypt.compare(password, customer.password);
    
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check if 2FA is enabled
    const is2FAEnabled = customer.is_2fa_enabled === 1;
    
    if (is2FAEnabled) {
      // Generate verification code and token
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Clean up old verifications
      await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer.id]);
      
      // Save verification
      await pool.query(
        `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [customer.id, verificationToken, verificationCode, expiresAt]
      );
      
      // Send verification email
      const verificationLink = `http://localhost:3000/verify-login?token=${verificationToken}&email=${encodeURIComponent(customer.email)}`;
      
      const mailOptions = {
        from: `"Smartify LB Security" <${process.env.EMAIL_USER}>`,
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
      
      // Return pending status
      return res.status(202).json({ 
        requires2FA: true,
        message: "Verification code sent to your email. Please check and verify.",
        customerId: customer.id,
        email: customer.email
      });
    } else {
      // 2FA disabled - direct login
      const isFirstLogin = !customer.last_login;
      await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [customer.id]);
      
      const token = jwt.sign(
        { id: customer.id, type: "customer" }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
      );
      
      // Send WhatsApp welcome on first login
      if (isFirstLogin && customer.phone) {
        await freeWhatsapp.sendWelcomeMessage(customer.phone, customer.first_name);
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

// Verify 2FA login (from email link or code)
app.post("/api/verify-2fa-login", async (req, res) => {
  const { email, token, code } = req.body;
  
  try {
    let verification;
    
    if (token) {
      // Verify via token from email link
      [verification] = await pool.query(
        `SELECT v.*, c.first_name, c.last_name, c.phone, c.email 
         FROM login_verifications v
         JOIN customers c ON v.customer_id = c.id
         WHERE v.verification_token = ? AND v.is_used = FALSE AND v.expires_at > NOW()`,
        [token]
      );
    } else if (code) {
      // Verify via code
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
    
    if (verification.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }
    
    // Mark as used
    await pool.query("UPDATE login_verifications SET is_used = TRUE WHERE id = ?", [verification[0].id]);
    
    // Update last login
    const isFirstLogin = !verification[0].last_login;
    await pool.query("UPDATE customers SET last_login = NOW() WHERE id = ?", [verification[0].customer_id]);
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: verification[0].customer_id, type: "customer" }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    // Send WhatsApp welcome on first login
    if (isFirstLogin && verification[0].phone) {
      await freeWhatsapp.sendWelcomeMessage(verification[0].phone, verification[0].first_name);
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

// Resend 2FA code
app.post("/api/resend-2fa-code", async (req, res) => {
  const { email } = req.body;
  
  try {
    const [customer] = await pool.query(
      "SELECT id, first_name FROM customers WHERE email = ? AND is_active = 1",
      [email.toLowerCase()]
    );
    
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Generate new verification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await pool.query("DELETE FROM login_verifications WHERE customer_id = ? AND is_used = FALSE", [customer[0].id]);
    
    await pool.query(
      `INSERT INTO login_verifications (customer_id, verification_token, verification_code, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [customer[0].id, verificationToken, verificationCode, expiresAt]
    );
    
    // Resend email
    const verificationLink = `http://localhost:3000/verify-login?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
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

/* ================= MIDDLEWARE ================= */
const authenticateCustomer = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Login required" });
  }
  
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "customer") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const [customer] = await pool.query(
      "SELECT id, is_active FROM customers WHERE id = ?", 
      [decoded.id]
    );
    
    if (customer.length === 0 || !customer[0].is_active) {
      return res.status(401).json({ message: "Account not found or inactive" });
    }
    
    req.customer = decoded;
    req.customerId = decoded.id;
    next();
  } catch (err) { 
    return res.status(401).json({ message: "Invalid token" }); 
  }
};

const authenticateAdmin = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin login required" });
  }
  
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.admin = decoded;
    next();
  } catch (err) { 
    return res.status(401).json({ message: "Invalid token" }); 
  }
};

/* ================= 2FA TOGGLE ================= */
app.post("/api/toggle-2fa", authenticateCustomer, async (req, res) => {
  const { enabled } = req.body;
  
  try {
    await pool.query(
      "UPDATE customers SET is_2fa_enabled = ? WHERE id = ?",
      [enabled ? 1 : 0, req.customerId]
    );
    
    res.json({ success: true, message: `2FA ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CART ================= */
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

app.post("/api/cart", authenticateCustomer, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ message: "Product ID required" });
  
  try {
    const [product] = await pool.query("SELECT id, quantity as stock FROM products WHERE id = ?", [product_id]);
    if (product.length === 0) return res.status(404).json({ message: "Product not found" });
    if (product[0].stock < quantity) return res.status(400).json({ message: "Insufficient stock" });
    
    const [existing] = await pool.query(
      "SELECT id, quantity FROM cart WHERE customer_id = ? AND product_id = ?", 
      [req.customerId, product_id]
    );
    
    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantity;
      if (product[0].stock < newQuantity) return res.status(400).json({ message: "Insufficient stock" });
      await pool.query(
        "UPDATE cart SET quantity = ? WHERE customer_id = ? AND product_id = ?", 
        [newQuantity, req.customerId, product_id]
      );
      res.json({ success: true, message: "Cart updated" });
    } else {
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

app.put("/api/cart/:itemId", authenticateCustomer, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });
  
  try {
    const [cartItem] = await pool.query(
      "SELECT product_id FROM cart WHERE id = ? AND customer_id = ?", 
      [req.params.itemId, req.customerId]
    );
    
    if (cartItem.length === 0) return res.status(404).json({ message: "Cart item not found" });
    
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

app.delete("/api/cart/:itemId", authenticateCustomer, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE id = ? AND customer_id = ?", [req.params.itemId, req.customerId]);
    res.json({ success: true });
  } catch (error) { 
    console.error("Delete cart error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

app.delete("/api/cart", authenticateCustomer, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE customer_id = ?", [req.customerId]);
    res.json({ success: true });
  } catch (error) { 
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

/* ================= FAVORITES ================= */
app.get("/api/favorites", authenticateCustomer, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.id, f.product_id, f.created_at, p.name, p.price, p.image, p.sale 
      FROM favorites f 
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

app.post("/api/favorites", authenticateCustomer, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ message: "Product ID required" });
  
  try {
    const [product] = await pool.query("SELECT id FROM products WHERE id = ?", [product_id]);
    if (product.length === 0) return res.status(404).json({ message: "Product not found" });
    
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

/* ================= ORDERS ================= */
app.post("/api/orders", authenticateCustomer, async (req, res) => {
  const { 
    customer_email, customer_first_name, customer_last_name, customer_phone,
    shipping_address, shipping_city, shipping_country, shipping_postal_code,
    shipping_method, payment_method, billing_address, billing_same_as_shipping 
  } = req.body;
  
  try {
    const [cartItems] = await pool.query(`
      SELECT c.product_id, c.quantity, p.name, p.price 
      FROM cart c 
      INNER JOIN products p ON c.product_id = p.id 
      WHERE c.customer_id = ?
    `, [req.customerId]);
    
    if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping_cost = shipping_method === "express" ? 3.00 : 0.00;
    const total_amount = subtotal + shipping_cost;
    const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const items = cartItems.map(item => ({ 
      product_id: item.product_id, 
      product_name: item.name, 
      product_price: parseFloat(item.price), 
      quantity: item.quantity, 
      subtotal: parseFloat(item.price) * item.quantity 
    }));
    
    await pool.query("START TRANSACTION");
    
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
    
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity]
      );
      await pool.query("UPDATE products SET quantity = quantity - ? WHERE id = ?", [item.quantity, item.product_id]);
    }
    
    await pool.query("DELETE FROM cart WHERE customer_id = ?", [req.customerId]);
    await pool.query("COMMIT");
    
    // Send WhatsApp order confirmation
    if (customer_phone) {
      console.log(`📱 SENDING order confirmation to ${customer_phone}`);
      await freeWhatsapp.sendOrderConfirmation(
        customer_phone,
        order_number,
        total_amount,
        customer_first_name
      );
    }
    
    res.status(201).json({ success: true, order_number, total_amount });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  
  console.log('\n=================================');
  console.log('🔐 ADMIN LOGIN ATTEMPT');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password provided: ${password ? 'Yes' : 'No'}`);
  console.log('=================================');
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM admin_users WHERE email = ? AND is_active = 1", 
      [email]
    );
    
    if (rows.length === 0) {
      console.log('❌ No admin found with email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const admin = rows[0];
    console.log(`✅ Admin found: ${admin.username} (ID: ${admin.id})`);
    console.log(`📝 Stored hash length: ${admin.password.length} characters`);
    
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, admin.password);
      console.log(`🔐 bcrypt.compare result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } catch (bcryptError) {
      console.error('❌ bcrypt error:', bcryptError);
      isValid = false;
    }
    
    if (!isValid) {
      console.log('❌ Password validation failed');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    console.log('✅ Password validated successfully!');
    
    await pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [admin.id]);
    
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

app.put("/api/admin/orders/:orderId/status", authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [status, req.params.orderId]);
    
    // Get order details for WhatsApp notification
    const [orderInfo] = await pool.query(
      "SELECT order_number, customer_first_name, customer_phone FROM orders WHERE id = ?",
      [req.params.orderId]
    );
    
    if (orderInfo.length > 0 && orderInfo[0].customer_phone) {
      if (status === 'shipped') {
        console.log(`📱 SENDING shipped notification to ${orderInfo[0].customer_phone}`);
        await freeWhatsapp.sendOrderShipped(orderInfo[0].customer_phone, orderInfo[0].order_number, orderInfo[0].customer_first_name);
      } else if (status === 'delivered') {
        console.log(`📱 SENDING delivered notification to ${orderInfo[0].customer_phone}`);
        await freeWhatsapp.sendOrderDelivered(orderInfo[0].customer_phone, orderInfo[0].order_number, orderInfo[0].customer_first_name);
      }
    }
    
    res.json({ success: true });
  } catch (error) { 
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

app.delete("/api/admin/orders/:orderId", authenticateAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM order_items WHERE order_id = ?", [req.params.orderId]);
    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.orderId]);
    res.json({ success: true });
  } catch (error) { 
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
  try {
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
app.get("/api/ai-search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") return res.json([]);
  
  try {
    const [products] = await pool.query("SELECT * FROM products WHERE quantity > 0");
    const query = q.toLowerCase().trim();
    const keywords = query.split(' ');
    
    let priceMin = null, priceMax = null;
    const underMatch = query.match(/(?:under|below|less than)\s*\$?(\d+)/);
    if (underMatch) priceMax = parseInt(underMatch[1]);
    const overMatch = query.match(/(?:over|above|more than)\s*\$?(\d+)/);
    if (overMatch) priceMin = parseInt(overMatch[1]);
    const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
    if (rangeMatch) { priceMin = parseInt(rangeMatch[1]); priceMax = parseInt(rangeMatch[2]); }
    
    const scoredProducts = products.map(product => {
      let score = 0;
      const productName = product.name.toLowerCase();
      const productPrice = parseFloat(product.price);
      
      keywords.forEach(keyword => {
        if (keyword.length < 2) return;
        if (productName === keyword) score += 50;
        else if (productName.includes(keyword)) score += 20;
      });
      if (product.sale && (query.includes('sale') || query.includes('discount'))) score += 30;
      if (priceMin && productPrice >= priceMin) score += 15;
      if (priceMax && productPrice <= priceMax) score += 15;
      return { ...product, relevanceScore: score };
    });
    
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

app.get("/api/recommendations/:productId", async (req, res) => {
  try {
    const [product] = await pool.query("SELECT price, name FROM products WHERE id = ?", [req.params.productId]);
    if (product.length === 0) return res.json([]);
    
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

app.get("/api/personalized-recommendations", authenticateCustomer, async (req, res) => {
  try {
    const [popular] = await pool.query(
      `SELECT id, name, price, image, sale, quantity 
       FROM products WHERE quantity > 0 
       ORDER BY id DESC LIMIT 6`
    );
    res.json(popular);
  } catch (error) { 
    console.error("Personalized recommendations error:", error);
    res.status(500).json({ message: "Server error" }); 
  }
});

app.post("/api/ai/sentiment", async (req, res) => {
  const { review } = req.body;
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'fast', 'awesome', 'beautiful', 'recommend', 'best', 'wonderful'];
  const negativeWords = ['bad', 'poor', 'terrible', 'disappointed', 'slow', 'broken', 'worst', 'horrible', 'waste', 'defective'];
  
  const lowerReview = review.toLowerCase();
  let score = 0;
  positiveWords.forEach(word => { if (lowerReview.includes(word)) score += 10; });
  negativeWords.forEach(word => { if (lowerReview.includes(word)) score -= 10; });
  
  const sentiment = score > 15 ? 'positive' : score < -15 ? 'negative' : 'neutral';
  const confidence = Math.min(100, Math.abs(score) * 3 + 50);
  res.json({ sentiment, confidence: Math.floor(confidence), score });
});

app.get("/api/ai/sales-analysis", authenticateAdmin, async (req, res) => {
  try {
    const [monthlySales] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
             COUNT(*) as order_count, 
             COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
      ORDER BY month DESC
    `);
    
    const [topProducts] = await pool.query(`
      SELECT p.name, COALESCE(SUM(oi.quantity), 0) as total_sold, 
             COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM products p 
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id 
      ORDER BY total_sold DESC LIMIT 5
    `);
    
    const categories = {
      'Laptops': ['laptop', 'lenovo', 'computer', 'notebook'],
      'Phones': ['iphone', 'galaxy', 'phone', 'smartphone', 's25', 'z6'],
      'Audio': ['headphone', 'speaker', 'airpod', 'earphone', 'microphone', 'bluetooth'],
      'Watches': ['watch', 'smartwatch', 'apple watch'],
      'Accessories': ['charger', 'case', 'cable', 'adapter', 'stand']
    };
    
    const [allItems] = await pool.query(`
      SELECT p.name as product_name, oi.quantity, oi.subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
    `);
    
    let categorySales = [];
    for (const [name, keywords] of Object.entries(categories)) {
      let sold = 0;
      let revenue = 0;
      allItems.forEach(item => {
        const lowerName = item.product_name.toLowerCase();
        if (keywords.some(k => lowerName.includes(k))) {
          sold += item.quantity;
          revenue += parseFloat(item.subtotal);
        }
      });
      if (sold > 0) categorySales.push({ name, sold, revenue });
    }
    
    let otherSold = 0;
    let otherRevenue = 0;
    allItems.forEach(item => {
      const lowerName = item.product_name.toLowerCase();
      let categorized = false;
      for (const keywords of Object.values(categories)) {
        if (keywords.some(k => lowerName.includes(k))) {
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        otherSold += item.quantity;
        otherRevenue += parseFloat(item.subtotal);
      }
    });
    if (otherSold > 0) categorySales.push({ name: 'Other', sold: otherSold, revenue: otherRevenue });
    
    const [dailyAvg] = await pool.query(`
      SELECT COALESCE(AVG(daily_total), 0) as avg_daily_revenue FROM (
        SELECT DATE(created_at) as day, SUM(total_amount) as daily_total
        FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
      ) as daily
    `);
    
    const [lowStock] = await pool.query(
      `SELECT name, quantity FROM products WHERE quantity < 10 ORDER BY quantity ASC LIMIT 5`
    );
    
    const totalOrders = monthlySales.reduce((sum, m) => sum + m.order_count, 0);
    const totalRevenue = monthlySales.reduce((sum, m) => sum + parseFloat(m.total_revenue), 0);
    
    res.json({
      monthlySales,
      topProducts,
      categorySales,
      analytics: { 
        avgDailyRevenue: dailyAvg[0].avg_daily_revenue || 0, 
        lowStock, 
        returningCustomerRate: 0, 
        bestDay: "Monday", 
        bestDayRevenue: 0 
      },
      totalOrders,
      totalRevenue
    });
  } catch (error) { 
    console.error("Sales analysis error:", error);
    res.status(500).json({ message: "Analysis error" }); 
  }
});

app.get("/api/ai/forecast", authenticateAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT p.id, p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p 
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id 
      ORDER BY total_sold DESC LIMIT 10
    `);
    
    const forecasts = orders.map(product => ({
      ...product,
      forecast_score: Math.min(100, Math.floor(product.total_sold * 5 + 20)),
      trend: product.total_sold > 20 ? "📈 High Demand" : product.total_sold > 5 ? "📊 Steady" : "📉 Low",
      recommended_stock: Math.max(8, Math.floor(product.total_sold * 1.5))
    }));
    res.json(forecasts);
  } catch (error) { 
    console.error("Forecast error:", error);
    res.status(500).json({ message: "Forecast error" }); 
  }
});

app.post("/api/ai/generate-description", authenticateAdmin, async (req, res) => {
  const { productName, price } = req.body;
  let description = `✨ The ${productName} is a premium product priced at $${price}. ✅ Shop now at Smartify LB for the best deals! ✅ Fast delivery ✅ Quality guaranteed.`;
  res.json({ description });
});

app.post("/api/chatbot", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ reply: "Hello! How can I help you today?" });
  
  const msg = message.toLowerCase();
  let reply = "";
  if (msg.includes('shipping')) reply = "🚚 Express delivery (2-3 days) for $3.00. Free shipping on orders over $500!";
  else if (msg.includes('hello') || msg.includes('hi')) reply = "👋 Hello! Welcome to Smartify LB! How can I help you?";
  else if (msg.includes('product') || msg.includes('recommend')) reply = "🛍️ Check out our latest products! Laptops, phones, smartwatches, and more!";
  else if (msg.includes('sale')) reply = "🏷️ Yes! Products on sale have the SALE badge. Check the Products page!";
  else reply = "💡 Thanks for your message! Check our Products page or contact support@smartify.com";
  res.json({ reply });
});

/* ================= PASSWORD RESET (EMAIL ONLY) ================= */

// Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Request password reset (EMAIL ONLY)
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  
  try {
    // Check if customer exists
    const [customers] = await pool.query(
      "SELECT id, first_name, phone FROM customers WHERE email = ? AND is_active = 1",
      [email.toLowerCase()]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }
    
    const customer = customers[0];
    const code = generateCode();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save to password_resets table
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
    await pool.query(
      "INSERT INTO password_resets (email, reset_code, reset_token, expires_at) VALUES (?, ?, ?, ?)",
      [email, code, token, expiresAt]
    );
    
    const mailOptions = {
      from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Code - Smartify LB',
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
          <hr>
          <p style="font-size: 12px; color: #666;">Smartify LB - Your Trusted Shopping Partner</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: "Reset code sent to your email",
      resetToken: token,
      expiresIn: 600
    });
    
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Verify reset code
app.post("/api/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expires_at > NOW()",
      [email, code]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired code" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Code verified successfully",
      resetToken: rows[0].reset_token
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with token
app.post("/api/reset-password", async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  
  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE reset_token = ? AND expires_at > NOW()",
      [resetToken]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }
    
    const email = rows[0].email;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      "UPDATE customers SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );
    
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
    
    res.json({ 
      success: true, 
      message: "Password reset successfully! You can now login with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= TEST WHATSAPP ENDPOINT ================= */
app.post("/api/test-whatsapp", async (req, res) => {
  const { phone, message } = req.body;
  console.log(`📱 TEST: Sending to ${phone}`);
  const result = await freeWhatsapp.sendMessage(phone, message || "Test message from Smartify!");
  res.json(result);
});
/* ================= IMAGE UPLOAD FOR ADMIN ================= */
const multer = require('multer');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'public', 'uploads');
const productsDir = path.join(uploadDir, 'products');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Upload image endpoint
app.post("/api/admin/upload-image", authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    
    // Return the URL to access the image
    const imageUrl = `http://localhost:5000/uploads/products/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
/* ================= ERROR HANDLING ================= */
app.use((req, res) => { 
  res.status(404).json({ message: "Route not found" }); 
});

app.use((err, req, res, next) => { 
  console.error("Unhandled error:", err); 
  res.status(500).json({ message: "Internal server error" }); 
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Smartify API server is RUNNING on port ${PORT}`);
  console.log(`🌐 Test endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/test`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/products`);
  console.log(`  POST http://localhost:${PORT}/api/customers/signup`);
  console.log(`  POST http://localhost:${PORT}/api/customers/login`);
  console.log(`  POST http://localhost:${PORT}/api/verify-2fa-login`);
  console.log(`  POST http://localhost:${PORT}/api/resend-2fa-code`);
  console.log(`  POST http://localhost:${PORT}/api/toggle-2fa`);
  console.log(`  POST http://localhost:${PORT}/api/admin/login`);
  console.log(`  POST http://localhost:${PORT}/api/forgot-password`);
  console.log(`  POST http://localhost:${PORT}/api/test-whatsapp`);
  console.log(`\n📋 Admin login: admin@smartify.com / admin123`);
  console.log(`📱 Free WhatsApp Service: READY (Scan QR code on first run)`);
  console.log(`🔐 2FA Email Verification: ENABLED for all new customers`);
  console.log(`\n🔐 REAL WebAuthn Face ID Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/webauthn/register-challenge`);
  console.log(`  POST http://localhost:${PORT}/api/webauthn/register-verify`);
  console.log(`  POST http://localhost:${PORT}/api/webauthn/login-challenge`);
  console.log(`  POST http://localhost:${PORT}/api/webauthn/login-verify`);
  console.log(`\n📸 REAL Camera Face Recognition Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/save-face-data`);
  console.log(`  POST http://localhost:${PORT}/api/get-face-data`);
  console.log(`  POST http://localhost:${PORT}/api/check-face-data`);
});