const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function createAdmin() {
  try {
    const password = 'AdminPassword123!';
    const pin = '123456';
    
    console.log('Generating hashes...');
    const passwordHash = await bcrypt.hash(password, 12);
    const pinHash = await bcrypt.hash(pin, 12);

    console.log('Inserting into database...');
    // Use IGNORE to not crash if admin already exists
    await pool.query(
      'INSERT IGNORE INTO admins (full_name, email, password_hash, pin_hash) VALUES (?, ?, ?, ?)',
      ['System Admin', 'admin@mentalbalancehub.com', passwordHash, pinHash]
    );

    console.log('----------------------------------------------------');
    console.log('✅ Admin User Created Successfully');
    console.log('Email: admin@mentalbalancehub.com');
    console.log('Password: AdminPassword123!');
    console.log('PIN: 123456');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
