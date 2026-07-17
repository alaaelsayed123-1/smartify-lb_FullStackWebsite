require('dotenv').config();

console.log('🟢 LOADING WhatsApp Service...');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class FreeWhatsAppService {
    constructor() {
        this.isReady = false;
        this.client = null;
        this.retryCount = 0;
        this.maxRetries = 2; // Reduced retries
        
        setTimeout(() => this.initialize(), 3000);
    }
    
    async cleanLockedSession() {
        const sessionPath = path.join(process.cwd(), '.wwebjs_auth');
        
        // If session doesn't exist, create it fresh
        if (!fs.existsSync(sessionPath)) {
            console.log('📁 Creating fresh WhatsApp session...');
            return;
        }
        
        try {
            const removeLockFiles = (dir) => {
                if (!fs.existsSync(dir)) return;
                
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    
                    try {
                        const stat = fs.statSync(filePath);
                        
                        if (stat.isDirectory()) {
                            removeLockFiles(filePath);
                        } else if (file.endsWith('-journal') || 
                                   file.endsWith('-wal') || 
                                   file.endsWith('-shm')) {
                            try {
                                fs.unlinkSync(filePath);
                                console.log(`🗑️ Cleaned: ${file}`);
                            } catch (e) {
                                // File locked, skip it
                            }
                        }
                    } catch (e) {
                        // Skip files we can't access
                    }
                });
            };
            
            removeLockFiles(sessionPath);
        } catch (error) {
            console.log('⚠️ Session cleanup:', error.message);
        }
    }
    
    async initialize() {
        try {
            await this.cleanLockedSession();
            
            console.log(`🔄 Initializing WhatsApp Client (Attempt ${this.retryCount + 1})...`);
            
            // CRITICAL FIX: Use specific Puppeteer config for Windows
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: path.join(process.cwd(), '.wwebjs_auth')
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-software-rasterizer',
                        '--disable-extensions',
                        '--disable-background-networking',
                        '--disable-sync',
                        '--no-first-run',
                        '--disable-features=TranslateUI',
                        '--disable-ipc-flooding-protection',
                        '--aggressive-cache-discard',
                        '--disable-cache',
                        '--disable-application-cache',
                        '--disable-offline-load-stale-cache',
                        '--disk-cache-size=0',
                        // Windows-specific fixes
                        '--disable-backgrounding-occluded-windows',
                        '--disable-breakpad',
                        '--disable-component-extensions-with-background-pages',
                        '--disable-component-update',
                        '--disable-default-apps',
                        '--disable-hang-monitor',
                        '--disable-prompt-on-repost',
                        '--disable-web-security',
                        '--enable-features=NetworkService,NetworkServiceInProcess',
                        '--force-color-profile=srgb',
                        '--metrics-recording-only',
                        '--no-pings',
                        '--password-store=basic',
                        '--use-mock-keychain',
                    ],
                    // CRITICAL: Don't handle SIGINT (Windows issue)
                    handleSIGINT: false,
                    handleSIGTERM: false,
                    handleSIGHUP: false,
                    // Timeout settings
                    timeout: 60000,
                    // Don't use sandbox on Windows
                    ignoreDefaultArgs: ['--enable-automation'],
                },
                // Restart options
                restartOnAuthFail: false,
                takeoverOnConflict: false,
            });
            
            // QR Code Event
            this.client.on('qr', (qr) => {
                this.retryCount = 0; // Reset on successful QR
                console.log('\n📱 =================================');
                console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
                console.log('📱 =================================');
                console.log('1. Open WhatsApp on your phone');
                console.log('2. Go to Settings → Linked Devices');
                console.log('3. Tap "Link a Device"');
                console.log('4. Scan the QR code below:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n📱 =================================\n');
            });
            
            // Ready Event
            this.client.on('ready', () => {
                console.log('✅ WhatsApp Service is READY!');
                console.log('📱 Both WhatsApp & Email notifications ENABLED\n');
                this.isReady = true;
            });
            
            // Loading screen event
            this.client.on('loading_screen', (percent, message) => {
                console.log(`🔄 WhatsApp Loading: ${percent}% - ${message}`);
            });
            
            // Authenticated Event
            this.client.on('authenticated', () => {
                console.log('🔐 WhatsApp Authenticated!');
            });
            
            // Auth Failure
            this.client.on('auth_failure', (msg) => {
                console.error('❌ Auth Failed:', msg);
                this.isReady = false;
            });
            
            // Disconnected
            this.client.on('disconnected', (reason) => {
                console.log('⚠️ WhatsApp Disconnected:', reason);
                this.isReady = false;
                
                if (reason === 'LOGOUT') {
                    console.log('🔄 User logged out - delete .wwebjs_auth folder to reset');
                } else if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`🔄 Reconnecting in 10 seconds...`);
                    setTimeout(() => this.initialize(), 10000);
                }
            });
            
            // CRITICAL: Initialize without await to prevent blocking
            this.client.initialize().catch(err => {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`⚠️ Init error, retrying in 10s...`);
                    setTimeout(() => this.initialize(), 10000);
                } else {
                    console.log('⚠️ WhatsApp unavailable. Email still works!');
                }
            });
            
        } catch (error) {
            console.error('❌ WhatsApp init error:', error.message);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.initialize(), 10000);
            } else {
                console.log('⚠️ WhatsApp disabled. EMAIL NOTIFICATIONS STILL ACTIVE ✅');
                this.isReady = false;
            }
        }
    }
    
    formatPhoneNumber(phone) {
        if (!phone) return null;
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        if (!cleaned.startsWith('961') && cleaned.length === 8) cleaned = '961' + cleaned;
        if (!cleaned.startsWith('961')) cleaned = '961' + cleaned;
        return cleaned;
    }
    
    async sendMessage(to, message) {
        if (!this.client || !this.isReady) {
            console.log('📧 WhatsApp not available - Email will handle notifications');
            return { success: false, error: 'WhatsApp not ready' };
        }
        
        const formattedNumber = this.formatPhoneNumber(to);
        if (!formattedNumber) return { success: false, error: 'Invalid number' };
        
        try {
            const result = await this.client.sendMessage(`${formattedNumber}@c.us`, message);
            console.log(`✅ WhatsApp sent to ${formattedNumber}`);
            return { success: true, result };
        } catch (error) {
            console.error('❌ WhatsApp send failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async sendWelcomeMessage(to, name) {
        const message = `🎉 *WELCOME TO SMARTIFY LB!* 🎉\n\n` +
                       `Hello *${name}*! 👋\n\n` +
                       `Thank you for joining Smartify LB! 🇱🇧\n\n` +
                       `✅ Latest electronics\n✅ Fast delivery\n✅ Best prices\n\n` +
                       `- Smartify LB Team 💙`;
        return await this.sendMessage(to, message);
    }
    
    async sendOrderConfirmation(to, orderNumber, totalAmount, customerName) {
        const message = `✅ *ORDER CONFIRMED* ✅\n\n` +
                       `Hello *${customerName}*,\n\n` +
                       `Order: *#${orderNumber}*\n` +
                       `Total: $${totalAmount}\n\n` +
                       `Thank you! 💙`;
        return await this.sendMessage(to, message);
    }
    
    async sendOrderShipped(to, orderNumber, customerName) {
        const message = `🚚 *ORDER SHIPPED!* 🚚\n\n` +
                       `Hello *${customerName}*,\n\n` +
                       `Order *#${orderNumber}* is on its way!\n\n` +
                       `- Smartify LB 💙`;
        return await this.sendMessage(to, message);
    }

    async sendOrderDelivered(to, orderNumber, customerName) {
        const message = `🎉 *DELIVERED!* 🎉\n\n` +
                       `Hello *${customerName}*,\n\n` +
                       `Order *#${orderNumber}* delivered!\n\n` +
                       `Enjoy! ⭐ - Smartify LB 💙`;
        return await this.sendMessage(to, message);
    }

    async sendOrderCancelled(to, orderNumber, customerName) {
        const message = `❌ *ORDER CANCELLED* ❌\n\n` +
                       `Hello *${customerName}*,\n\n` +
                       `Order *#${orderNumber}* cancelled.\n\n` +
                       `Questions? Contact us.\n- Smartify LB 💙`;
        return await this.sendMessage(to, message);
    }

    async sendOrderProcessing(to, orderNumber, customerName) {
        const message = `⚙️ *PROCESSING* ⚙️\n\n` +
                       `Hello *${customerName}*,\n\n` +
                       `Order *#${orderNumber}* is processing!\n\n` +
                       `- Smartify LB 💙`;
        return await this.sendMessage(to, message);
    }
}

const whatsappService = new FreeWhatsAppService();
console.log('🟢 WhatsApp Service Module Loaded!');
module.exports = whatsappService;