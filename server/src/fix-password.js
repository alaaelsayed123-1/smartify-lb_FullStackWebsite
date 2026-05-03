const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'smartify_lb',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

async function fixAdminPassword() {
    const password = 'admin123';
    
    console.log('=================================');
    console.log('🔧 FIXING ADMIN PASSWORD');
    console.log('=================================');
    console.log(`Password to set: ${password}`);
    console.log('');
    
    try {
        // Generate a new hash
        const hash = await bcrypt.hash(password, 10);
        console.log(`Generated hash: ${hash}`);
        console.log(`Hash length: ${hash.length}`);
        console.log('');
        
        // Update the admin user
        const [result] = await pool.query(
            'UPDATE admin_users SET password = ? WHERE email = ?',
            [hash, 'admin@smartify.com']
        );
        
        console.log(`✅ Updated ${result.affectedRows} user(s)`);
        console.log('');
        
        // Verify the update
        const [rows] = await pool.query(
            'SELECT id, username, email, LENGTH(password) as hash_len FROM admin_users WHERE email = ?',
            ['admin@smartify.com']
        );
        
        if (rows.length > 0) {
            console.log('Verification:');
            console.log(`  ID: ${rows[0].id}`);
            console.log(`  Username: ${rows[0].username}`);
            console.log(`  Email: ${rows[0].email}`);
            console.log(`  Hash length: ${rows[0].hash_len}`);
            console.log('');
            
            // Test the password with the new hash
            const isValid = await bcrypt.compare(password, hash);
            console.log(`Testing password "${password}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        }
        
        console.log('');
        console.log('=================================');
        console.log('✅ PASSWORD FIX COMPLETE!');
        console.log('=================================');
        console.log('Now test with:');
        console.log('curl -X POST http://localhost:5000/api/admin/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@smartify.com\\",\\"password\\":\\"admin123\\"}"');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixAdminPassword();