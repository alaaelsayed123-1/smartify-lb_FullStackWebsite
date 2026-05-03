// services/passwordResetService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../config/mysql');
const bcrypt = require('bcrypt');

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

// Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Save reset code/token to database
const saveResetCode = async (email, code, token, expiresAt) => {
  await pool.query(
    "DELETE FROM password_resets WHERE email = ?",
    [email]
  );
  
  await pool.query(
    "INSERT INTO password_resets (email, reset_code, reset_token, expires_at) VALUES (?, ?, ?, ?)",
    [email, code, token, expiresAt]
  );
};

// Send WhatsApp reset code (DISABLED)
const sendWhatsAppCode = async (phone, code) => {
  console.log(`📱 WhatsApp would send code ${code} to ${phone} (WhatsApp disabled)`);
  return { success: true };
};

// Send email reset code
const sendEmailCode = async (email, code) => {
  const mailOptions = {
    from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Code - Smartify LB',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Smartify LB</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hello,</p>
          <p>We received a request to reset your password.</p>
          <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px;">${code}</span>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          Smartify LB - Your Trusted Shopping Partner
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset code sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

// Verify reset code
const verifyResetCode = async (email, code) => {
  const [rows] = await pool.query(
    "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expires_at > NOW()",
    [email, code]
  );
  
  if (rows.length === 0) {
    return { valid: false, message: "Invalid or expired code" };
  }
  
  return { valid: true, token: rows[0].reset_token };
};

// Update password using token
const updatePasswordWithToken = async (token, newPassword) => {
  const [rows] = await pool.query(
    "SELECT * FROM password_resets WHERE reset_token = ? AND expires_at > NOW()",
    [token]
  );
  
  if (rows.length === 0) {
    return { success: false, message: "Invalid or expired token" };
  }
  
  const email = rows[0].email;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await pool.query(
    "UPDATE customers SET password = ? WHERE email = ?",
    [hashedPassword, email]
  );
  
  await pool.query(
    "DELETE FROM password_resets WHERE email = ?",
    [email]
  );
  
  return { success: true, message: "Password updated successfully" };
};

module.exports = {
  generateCode,
  generateToken,
  saveResetCode,
  sendWhatsAppCode,
  sendEmailCode,
  verifyResetCode,
  updatePasswordWithToken
};