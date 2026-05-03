console.log('🟢 LOADING WhatsApp Service...');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class FreeWhatsAppService {
    constructor() {
        console.log('🔄 Initializing WhatsApp Client...');
        this.isReady = false;
        
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.client.on('qr', (qr) => {
            console.log('\n📱 =================================');
            console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
            console.log('=================================');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Go to Settings → Linked Devices');
            console.log('3. Tap "Link a Device"');
            console.log('4. Scan the QR code below:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n=================================\n');
        });
        
        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp AUTHENTICATED - Session loaded successfully!');
        });
        
        this.client.on('ready', () => {
            console.log('✅ Free WhatsApp Service is READY!');
            console.log('📱 You can now send WhatsApp messages to customers\n');
            this.isReady = true;
        });
        
        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failed:', msg);
        });
        
        this.client.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp disconnected:', reason);
            this.isReady = false;
        });
        
        console.log('🔄 Calling client.initialize()...');
        this.client.initialize();
    }
    
    formatPhoneNumber(phone) {
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        if (!cleaned.startsWith('961') && cleaned.length === 8) {
            cleaned = '961' + cleaned;
        }
        if (!cleaned.startsWith('961')) {
            cleaned = '961' + cleaned;
        }
        return cleaned;
    }
    
    async sendMessage(to, message) {
        if (!this.isReady) {
            console.log('⚠️ WhatsApp not ready yet. Please wait...');
            return { success: false, error: 'WhatsApp not ready' };
        }
        
        const formattedNumber = this.formatPhoneNumber(to);
        const chatId = `${formattedNumber}@c.us`;
        
        try {
            const result = await this.client.sendMessage(chatId, message);
            console.log(`✅ WhatsApp sent to ${formattedNumber}`);
            return { success: true, result };
        } catch (error) {
            console.error('❌ Failed to send WhatsApp:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async sendWelcomeMessage(to, name) {
        const message = `🎉 WELCOME TO SMARTIFY LB! 🎉\n\nHello ${name}! 👋\n\nThank you for joining Smartify LB - your trusted electronics store in Lebanon!\n\n✅ Shop the latest phones, laptops, and accessories\n✅ Fast delivery across Lebanon\n✅ Best prices guaranteed\n\nStart shopping now: http://localhost:3000\n\nNeed help? Contact us anytime!\n\n- Smartify LB Team 💙`;
        return await this.sendMessage(to, message);
    }
    
    async sendOrderConfirmation(to, orderNumber, totalAmount, customerName) {
        const message = `✅ ORDER CONFIRMATION - SMARTIFY LB ✅\n\nHello ${customerName},\n\nYour order #${orderNumber} has been placed successfully!\n\n💰 Total Amount: $${totalAmount}\n📦 Status: Pending\n\nWe'll notify you when your order is shipped.\n\nTrack your order: http://localhost:3000/orders\n\nThank you for shopping with Smartify LB! 💙`;
        return await this.sendMessage(to, message);
    }
    
    async sendOrderShipped(to, orderNumber, customerName) {
        const message = `🚚 ORDER SHIPPED - SMARTIFY LB 🚚\n\nHello ${customerName},\n\nGreat news! Your order #${orderNumber} has been shipped!\n\nYour package is on its way and will arrive soon.\n\nTrack your order: http://localhost:3000/orders\n\nThank you for choosing Smartify LB! 💙`;
        return await this.sendMessage(to, message);
    }
    
    async sendOrderDelivered(to, orderNumber, customerName) {
        const message = `🎉 ORDER DELIVERED - SMARTIFY LB 🎉\n\nHello ${customerName},\n\nYour order #${orderNumber} has been delivered!\n\nWe hope you love your new products! ⭐\n\nLeave a review: http://localhost:3000/reviews\n\nThank you for shopping with Smartify LB! 💙`;
        return await this.sendMessage(to, message);
    }
}

console.log('🟢 WhatsApp Service Module Loaded Successfully!');
module.exports = new FreeWhatsAppService();