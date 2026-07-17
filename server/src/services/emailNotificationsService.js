    const nodemailer = require('nodemailer');
    require('dotenv').config();

    class EmailNotificationsService {
        constructor() {
            this.isReady = false;
            this.initializeTransporter();
        }
        
        initializeTransporter() {
            try {
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                
                this.transporter.verify((error) => {
                    if (error) {
                        console.error('❌ Email service error:', error.message);
                        this.isReady = false;
                    } else {
                        console.log('✅ Email Notification Service READY');
                        this.isReady = true;
                    }
                });
            } catch (error) {
                console.error('❌ Email initialization failed:', error.message);
                this.isReady = false;
            }
        }
        
        getBaseTemplate(title, content) {
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🏪 Smartify LB</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Trusted Electronics Store in Lebanon</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">${title}</h2>
                        ${content}
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>Smartify LB | Tyre, Lebanon</p>
                        <p>📞 +961 76 883 284 | 📧 alaa.alsayed003@gmail.com</p>
                        <p>© ${new Date().getFullYear()} Smartify LB. All rights reserved.</p>
                    </div>
                </div>
            `;
        }
        
        async sendEmail(to, subject, html) {
            if (!this.isReady) {
                console.log('⚠️ Email service not ready, trying to send anyway...');
            }
            
            try {
                const mailOptions = {
                    from: `"Smartify LB" <${process.env.EMAIL_USER}>`,
                    to: to,
                    subject: subject,
                    html: html
                };
                
                await this.transporter.sendMail(mailOptions);
                console.log(`📧 Email sent to ${to}: ${subject}`);
                return { success: true };
            } catch (error) {
                console.error(`❌ Failed to send email to ${to}:`, error.message);
                return { success: false, error: error.message };
            }
        }
        
        async sendWelcomeEmail(email, firstName) {
            const subject = '🎉 Welcome to Smartify LB!';
            const content = `
                <p>Hello <strong>${firstName}</strong>! 👋</p>
                <p>Welcome to <strong>Smartify LB</strong> - your premier electronics store in Lebanon!</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <h3 style="color: #667eea; margin-top: 0;">What you can do:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0;">✅ Browse latest smartphones, laptops & accessories</li>
                        <li style="padding: 8px 0;">✅ Fast delivery across Lebanon</li>
                        <li style="padding: 8px 0;">✅ Best prices guaranteed</li>
                        <li style="padding: 8px 0;">✅ Secure checkout with order tracking</li>
                    </ul>
                </div>
                <p>Start shopping now and enjoy exclusive member deals!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">🛍️ Start Shopping</a>
                </div>
                <p>Need help? Reply to this email or contact our support team.</p>
                <p>Best regards,<br><strong>Smartify LB Team</strong> 💙</p>
            `;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendOrderConfirmation(email, orderNumber, totalAmount, customerName, items) {
            const subject = `✅ Order Confirmed - #${orderNumber}`;
            const itemsList = items ? items.map(item => 
                `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}x</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal}</td></tr>`
            ).join('') : '';
            const content = `
                <p>Hello <strong>${customerName}</strong>,</p>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="color: #2e7d32; margin: 0; font-size: 18px;">✅ Your order has been placed successfully!</p></div>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #667eea; margin-top: 0;">Order Details</h3>
                    <p><strong>Order Number:</strong> #${orderNumber}</p>
                    <p><strong>Status:</strong> <span style="color: #ff9800;">⏳ Pending</span></p>
                    ${items ? `<table style="width: 100%; border-collapse: collapse; margin: 15px 0;"><thead><tr style="background: #f5f5f5;"><th style="padding: 10px; text-align: left;">Product</th><th style="padding: 10px; text-align: center;">Qty</th><th style="padding: 10px; text-align: right;">Price</th></tr></thead><tbody>${itemsList}</tbody></table>` : ''}
                    <div style="border-top: 2px solid #667eea; margin-top: 15px; padding-top: 15px;"><p style="font-size: 20px; font-weight: bold; color: #667eea;">Total: $${totalAmount}</p></div>
                </div>
                <p>We'll notify you when your order ships!</p>
            `;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendOrderShipped(email, orderNumber, customerName) {
            const subject = `🚚 Order Shipped - #${orderNumber}`;
            const content = `<p>Hello <strong>${customerName}</strong>,</p><div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="color: #1565c0; margin: 0; font-size: 18px;">🚚 Great news! Your order is on its way!</p></div><p>Order <strong>#${orderNumber}</strong> has been shipped.</p>`;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendOrderDelivered(email, orderNumber, customerName) {
            const subject = `🎉 Order Delivered - #${orderNumber}`;
            const content = `<p>Hello <strong>${customerName}</strong>,</p><div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="color: #2e7d32; margin: 0; font-size: 18px;">🎉 Your order has been delivered!</p></div><p>Order <strong>#${orderNumber}</strong> delivered. Enjoy! ⭐</p>`;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendOrderCancelled(email, orderNumber, customerName) {
            const subject = `❌ Order Cancelled - #${orderNumber}`;
            const content = `<p>Hello <strong>${customerName}</strong>,</p><div style="background: #fce4ec; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="color: #c62828; margin: 0; font-size: 18px;">❌ Your order has been cancelled</p></div><p>Order <strong>#${orderNumber}</strong> cancelled.</p>`;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendOrderProcessing(email, orderNumber, customerName) {
            const subject = `⚙️ Order Processing - #${orderNumber}`;
            const content = `<p>Hello <strong>${customerName}</strong>,</p><div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="color: #e65100; margin: 0; font-size: 18px;">⚙️ Your order is being processed</p></div><p>Order <strong>#${orderNumber}</strong> is processing.</p>`;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
        
        async sendVerificationCode(email, code, customerName) {
            const subject = '🔐 Login Verification Code - Smartify LB';
            const content = `
                <p>Hello <strong>${customerName}</strong>,</p>
                <p>Someone is trying to log into your Smartify LB account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; display: inline-block;">
                        <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
                        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 10px 0;">${code}</p>
                    </div>
                </div>
                <p style="color: #e65100;">⚠️ This code will expire in <strong>10 minutes</strong>.</p>
            `;
            return await this.sendEmail(email, subject, this.getBaseTemplate(subject, content));
        }
    }

    // EXPORT ONLY THE EMAIL SERVICE
    const emailService = new EmailNotificationsService();
    module.exports = emailService;