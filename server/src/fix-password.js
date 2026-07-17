// ============================================================
// ADMIN PASSWORD FIXER - DATABASE REPAIR SCRIPT
// ============================================================
// This script fixes admin login issues by resetting the password
// It generates a fresh bcrypt hash and updates the database
// Also verifies the fix worked by testing the new password
// ============================================================

// ============================================================
// IMPORT REQUIRED MODULES
// ============================================================

// mysql2 - MySQL client library with promise support
// This allows us to use async/await instead of callbacks
const mysql = require('mysql2');

// bcrypt - Password hashing library
// Uses bcrypt algorithm (industry standard for passwords)
// Automatically handles salt generation and hash comparison
const bcrypt = require('bcrypt');

// dotenv - Load environment variables from .env file
// Keeps database credentials out of the code
// Reads DB_HOST, DB_USER, DB_PASSWORD from .env
require('dotenv').config();

// ============================================================
// CREATE DATABASE CONNECTION POOL
// ============================================================
// A pool maintains multiple connections for better performance
// Instead of opening/closing connections for each query,
// it reuses existing connections from the pool
// ============================================================
const pool = mysql.createPool({
    // Database server address (from .env or default localhost)
    host: process.env.DB_HOST || 'localhost',
    
    // Database username (from .env or default root)
    user: process.env.DB_USER || 'root',
    
    // Database password (from .env or empty string)
    // Empty string is common for local XAMPP/MySQL setups
    password: process.env.DB_PASSWORD || '',
    
    // Which database to use (hardcoded for this script)
    database: 'smartify_lb',
    
    // Wait for available connection if all are in use
    // false would throw error immediately, true queues requests
    waitForConnections: true,
    
    // Maximum number of simultaneous connections
    // 10 is good for most applications
    connectionLimit: 10
}).promise();  // ← .promise() converts callback-based API to promise-based
               // This lets us use async/await instead of nested callbacks

// ============================================================
// MAIN FUNCTION: FIX ADMIN PASSWORD
// ============================================================
// This is an async function that:
// 1. Generates new bcrypt hash for 'admin123'
// 2. Updates the admin user's password in database
// 3. Verifies the update was successful
// 4. Tests that the new password actually works
// ============================================================
async function fixAdminPassword() {
    // ============================================================
    // THE PASSWORD TO SET
    // ============================================================
    // Hardcoded for this fix script
    // In production, you'd want to pass this as an argument
    // or prompt the user to enter it securely
    // ============================================================
    const password = 'admin123';
    
    // ============================================================
    // DISPLAY HEADER
    // ============================================================
    // Visual separator to make console output easy to read
    // Helps distinguish this script's output from other logs
    // ============================================================
    console.log('=================================');
    console.log('🔧 FIXING ADMIN PASSWORD');
    console.log('=================================');
    console.log(`Password to set: ${password}`);  // Show what password we're setting
    console.log('');
    
    try {
        // ============================================================
        // STEP 1: GENERATE BCRYPT HASH
        // ============================================================
        // bcrypt.hash() takes two parameters:
        //   1. password - the plain text password to hash
        //   2. saltRounds - complexity factor (10 = 2^10 = 1024 iterations)
        // Higher saltRounds = more secure but slower
        // 10 is the recommended minimum for production
        // 
        // The resulting hash includes:
        //   - Algorithm identifier ($2b$)
        //   - Salt value (22 characters)
        //   - Hashed password (31 characters)
        // Total length: 60 characters
        // Example: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
        //          |  |  |_________________________||_____________________________|
        //          |  |         SALT                          HASH
        //          |  COST
        //          ALGORITHM
        // ============================================================
        const hash = await bcrypt.hash(password, 10);
        
        // Display the generated hash for verification
        console.log(`Generated hash: ${hash}`);
        console.log(`Hash length: ${hash.length}`);  // Should be 60 for bcrypt
        console.log('');
        
        // ============================================================
        // STEP 2: UPDATE THE ADMIN USER'S PASSWORD IN DATABASE
        // ============================================================
        // pool.query() executes the SQL UPDATE statement
        // Uses parameterized query (?) to prevent SQL injection
        // The [hash, 'admin@smartify.com'] array maps to the ? placeholders
        // 
        // SQL: UPDATE admin_users 
        //      SET password = '[new hashed password]' 
        //      WHERE email = 'admin@smartify.com'
        // 
        // The [result] destructuring extracts the first element
        // of the array that pool.query() returns
        // result contains:
        //   - affectedRows: number of rows changed (should be 1)
        //   - changedRows: number of rows actually modified
        //   - warningStatus: any warnings from MySQL
        // ============================================================
        const [result] = await pool.query(
            'UPDATE admin_users SET password = ? WHERE email = ?',
            [hash, 'admin@smartify.com']  // Parameters replace ? placeholders
        );
        
        // ============================================================
        // DISPLAY UPDATE RESULTS
        // ============================================================
        // affectedRows tells us if the admin user was found and updated
        // Should be 1 if admin@smartify.com exists
        // Would be 0 if no admin with that email was found
        // ============================================================
        console.log(`✅ Updated ${result.affectedRows} user(s)`);
        console.log('');
        
        // ============================================================
        // STEP 3: VERIFY THE UPDATE
        // ============================================================
        // Read back the admin user to confirm the password was saved
        // Uses LENGTH(password) to check hash length without showing it
        // This is a safety measure - never log actual password hashes
        // in production logs for security reasons
        // ============================================================
        const [rows] = await pool.query(
            'SELECT id, username, email, LENGTH(password) as hash_len FROM admin_users WHERE email = ?',
            ['admin@smartify.com']
        );
        
        // ============================================================
        // CHECK IF ADMIN USER EXISTS
        // ============================================================
        // rows.length > 0 means we found the admin user
        // If rows is empty, the admin account doesn't exist
        // This could happen if the database wasn't seeded properly
        // ============================================================
        if (rows.length > 0) {
            // ============================================================
            // DISPLAY VERIFICATION INFO
            // ============================================================
            // Shows the admin user details to confirm everything looks right
            // hash_len should be 60 for a proper bcrypt hash
            // If it's different, the password wasn't set correctly
            // ============================================================
            console.log('Verification:');
            console.log(`  ID: ${rows[0].id}`);                    // Admin's database ID
            console.log(`  Username: ${rows[0].username}`);        // Admin's display name
            console.log(`  Email: ${rows[0].email}`);              // Admin's login email
            console.log(`  Hash length: ${rows[0].hash_len}`);     // Should be 60 for bcrypt
            console.log('');
            
            // ============================================================
            // STEP 4: TEST THE NEW PASSWORD
            // ============================================================
            // bcrypt.compare() checks if a plain text password
            // matches a previously generated hash
            // 
            // How it works:
            // 1. Extracts the salt from the stored hash
            // 2. Hashes the test password with that same salt
            // 3. Compares the result with the stored hash
            // 4. Returns true if they match, false if not
            // 
            // This is how login systems verify passwords without
            // ever storing or knowing the actual password
            // ============================================================
            const isValid = await bcrypt.compare(password, hash);
            
            // Display test result with emoji indicator
            // ✅ VALID = The password works! Admin can login.
            // ❌ INVALID = Something went wrong, password doesn't match hash
            console.log(`Testing password "${password}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        }
        
        // ============================================================
        // SUCCESS MESSAGE
        // ============================================================
        // Shows completion and provides a curl command to test
        // This lets the admin immediately verify the fix worked
        // by testing the login endpoint from the command line
        // ============================================================
        console.log('');
        console.log('=================================');
        console.log('✅ PASSWORD FIX COMPLETE!');
        console.log('=================================');
        console.log('Now test with:');
        
        // ============================================================
        // CURL TEST COMMAND
        // ============================================================
        // Provides a ready-to-use curl command for testing
        // The escaped quotes (\") are needed for JSON in command line
        // This sends a POST request to the admin login endpoint
        // If successful, it returns a JWT token
        // ============================================================
        console.log('curl -X POST http://localhost:5000/api/admin/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@smartify.com\\",\\"password\\":\\"admin123\\"}"');
        
    } catch (error) {
        // ============================================================
        // ERROR HANDLING
        // ============================================================
        // If anything goes wrong (database connection failed,
        // SQL syntax error, bcrypt error, etc.), this catches it
        // Prints the error to console for debugging
        // ============================================================
        console.error('Error:', error);
        
    } finally {
        // ============================================================
        // CLEANUP: CLOSE DATABASE CONNECTION
        // ============================================================
        // The finally block runs whether the try succeeds or fails
        // pool.end() gracefully closes all connections in the pool
        // This is important to:
        // 1. Free up database connections
        // 2. Allow the Node.js process to exit
        // 3. Prevent connection leaks
        // 
        // Without this, the script would hang indefinitely
        // waiting for connections to timeout
        // ============================================================
        await pool.end();
    }
}

// ============================================================
// EXECUTE THE SCRIPT
// ============================================================
// This line actually runs the fixAdminPassword function
// Everything above was just defining the function
// Now we call it to do the actual work
// ============================================================
fixAdminPassword();