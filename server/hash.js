const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function hashAdminPasswords() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smartify_db"
  });

  try {
    const [admins] = await pool.query("SELECT id, password FROM admin_users");
    
    for (const admin of admins) {
      // Check if password is already hashed (starts with $2b$)
      if (!admin.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await pool.query("UPDATE admin_users SET password = ? WHERE id = ?", [hashedPassword, admin.id]);
        console.log(`✅ Updated admin ID ${admin.id} password to hash`);
      } else {
        console.log(`⏭️ Admin ID ${admin.id} password already hashed`);
      }
    }
    
    console.log("✅ All admin passwords processed");
    await pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

hashAdminPasswords();