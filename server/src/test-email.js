const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=================================');
console.log('📧 EMAIL CONFIGURATION TEST');
console.log('=================================\n');

// Check environment variables
console.log('🔍 Checking .env configuration:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✓ Set to: ' + process.env.EMAIL_USER : '✗ MISSING'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ Set (' + process.env.EMAIL_PASS.length + ' characters)' : '✗ MISSING'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n❌ ERROR: Email credentials missing in .env file!');
  console.log('💡 Add to your .env file:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASS=your-app-password');
  process.exit(1);
}

// Check if password has spaces (common mistake)
if (process.env.EMAIL_PASS.includes(' ')) {
  console.log('\n⚠️  WARNING: Your EMAIL_PASS contains spaces!');
  console.log('   App passwords should NOT have spaces.');
  console.log('   Please remove spaces from the password.\n');
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, '') // Remove spaces if any
  },
  tls: {
    rejectUnauthorized: false // Only for testing
  }
});

// Verify connection
console.log('\n🔌 Testing SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP connection failed!');
    console.log('   Error:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('   1. Check your email address in .env');
    console.log('   2. Make sure 2-Step Verification is enabled on your Google account');
    console.log('   3. Generate a new App Password: https://myaccount.google.com/apppasswords');
    console.log('   4. If using regular password, enable "Less secure app access"');
    console.log('   5. Check that the password has no spaces');
    process.exit(1);
  } else {
    console.log('✅ SMTP connection successful!');
    sendTestEmail();
  }
});

// Send test email
function sendTestEmail() {
  console.log('\n📧 Sending test email...');
  
  const mailOptions = {
    from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: '✅ Smartify LB - Email Configuration Test',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: rgba(255,255,255,0.9);
            margin: 10px 0 0;
          }
          .content {
            padding: 40px 30px;
          }
          .success-badge {
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 25px;
            border-left: 4px solid #28a745;
          }
          .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
            font-family: monospace;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
          }
          .checkmark {
            font-size: 48px;
            color: #28a745;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="checkmark">✅</div>
            <h1>Email Configuration Working!</h1>
            <p>Your Smartify LB email system is ready</p>
          </div>
          <div class="content">
            <div class="success-badge">
              🎉 Test Email Sent Successfully!
            </div>
            
            <p>Hello <strong>Smartify Admin</strong>,</p>
            
            <p>This is a test email from your <strong>Smartify LB</strong> e-commerce platform.</p>
            
            <div class="info-box">
              <div class="info-item">
                <span class="info-label">📧 From:</span>
                <span class="info-value">${process.env.EMAIL_USER}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Time:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🖥️ Server:</span>
                <span class="info-value">Smartify LB Backend</span>
              </div>
            </div>
            
            <p>Your email configuration is working perfectly! This means:</p>
            <ul>
              <li>✅ Password reset emails will be delivered</li>
              <li>✅ Order confirmations will be sent</li>
              <li>✅ Customer notifications will work</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000" class="button">Go to Smartify LB</a>
            </div>
          </div>
          <div class="footer">
            <p>Smartify LB - Your Trusted Shopping Partner</p>
            <p>This is an automated test email. No action is required.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
✅ Smartify LB - Email Configuration Test

Hello Smartify Admin,

This is a test email from your Smartify LB e-commerce platform.

Your email configuration is working perfectly!

Test Details:
- From: ${process.env.EMAIL_USER}
- Time: ${new Date().toLocaleString()}
- Server: Smartify LB Backend

This means:
✅ Password reset emails will be delivered
✅ Order confirmations will be sent
✅ Customer notifications will work

Smartify LB - Your Trusted Shopping Partner
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Failed to send test email!');
      console.log('   Error:', error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify the email address exists');
      console.log('   3. Check if your Gmail account has 2FA enabled');
      console.log('   4. Generate a new App Password');
      process.exit(1);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   To: ${process.env.EMAIL_USER}`);
      console.log('\n✨ Check your inbox! (Also check spam folder)');
      console.log('\n=================================');
      console.log('🎉 Email configuration is WORKING!');
      console.log('=================================');
      process.exit(0);
    }
  });
}