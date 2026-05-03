const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Testing email configuration...');
console.log('Email:', process.env.EMAIL_USER);
console.log('Password:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: '✅ Password Reset System Test',
  text: 'Your password reset system is working perfectly! 🎉\n\nYou can now reset passwords via email.'
}, (err, info) => {
  if (err) {
    console.log('❌ Error:', err.message);
    console.log('Please check your app password.');
  } else {
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox:', process.env.EMAIL_USER);
  }
});