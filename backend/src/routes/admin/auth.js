const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const { generateAdminToken } = require('../../utils/generateToken');

// POST /api/admin/auth/login (Step 1)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

  try {
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Incorrect credentials' });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return res.status(403).json({ message: 'Admin account inactive' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect credentials' });
    }

    // Check lockouts
    const [lockouts] = await pool.query('SELECT * FROM admin_lockouts WHERE admin_id = ?', [admin.id]);
    if (lockouts.length > 0 && lockouts[0].locked_until && new Date(lockouts[0].locked_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(lockouts[0].locked_until) - new Date()) / 60000);
      return res.status(423).json({ message: `Locked, try in ${waitMinutes} mins` });
    }

    // Create short-lived temp token (5 min) for Step 2
    const tempToken = jwt.sign({ adminId: admin.id, step: 'pin_required' }, process.env.JWT_ADMIN_SECRET, { expiresIn: '5m' });

    res.json({ step: 'pin_required', tempToken });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/auth/verify-pin (Step 2)
router.post('/verify-pin', async (req, res) => {
  const { tempToken, pin } = req.body;
  if (!tempToken || !pin) return res.status(400).json({ message: 'Missing token or PIN' });

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET);
    if (decoded.step !== 'pin_required') return res.status(401).json({ message: 'Invalid token type' });

    const adminId = decoded.adminId;

    const [admins] = await pool.query('SELECT pin_hash FROM admins WHERE id = ?', [adminId]);
    if (admins.length === 0) return res.status(404).json({ message: 'Admin not found' });
    
    // Check lockouts
    let [lockouts] = await pool.query('SELECT * FROM admin_lockouts WHERE admin_id = ?', [adminId]);
    if (lockouts.length > 0 && lockouts[0].locked_until && new Date(lockouts[0].locked_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(lockouts[0].locked_until) - new Date()) / 60000);
      return res.status(423).json({ message: `Locked, try in ${waitMinutes} mins` });
    }

    const isMatch = await bcrypt.compare(pin, admins[0].pin_hash);

    if (!isMatch) {
      if (lockouts.length === 0) {
        await pool.query('INSERT INTO admin_lockouts (admin_id, attempts, last_attempt) VALUES (?, 1, NOW())', [adminId]);
        return res.status(401).json({ message: 'Incorrect PIN', attemptsRemaining: 2 });
      } else {
        const attempts = lockouts[0].attempts + 1;
        let query = 'UPDATE admin_lockouts SET attempts = ?, last_attempt = NOW()';
        let remaining = 3 - attempts;
        let params = [attempts];

        if (attempts >= 3) {
          query += ', locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE)';
          remaining = 0;
        }

        query += ' WHERE admin_id = ?';
        params.push(adminId);

        await pool.query(query, params);
        
        if (attempts >= 3) {
            return res.status(423).json({ message: 'Account locked for 30 minutes due to too many failed attempts' });
        }

        return res.status(401).json({ message: 'Incorrect PIN', attemptsRemaining: remaining });
      }
    }

    // Reset attempts if correct
    if (lockouts.length > 0) {
      await pool.query('UPDATE admin_lockouts SET attempts = 0, locked_until = NULL WHERE admin_id = ?', [adminId]);
    }

    // Full admin token
    const token = generateAdminToken({ adminId, role: 'admin' });

    // Log audit
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await pool.query(
      'INSERT INTO audit_logs (admin_id, action_type, description, ip_address) VALUES (?, "login", "Admin logged in successfully", ?)',
      [adminId, ip]
    );

    res.json({ token, message: 'Logged in successfully' });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
       return res.status(401).json({ message: 'Session expired, please login again' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/auth/logout
router.post('/logout', async (req, res) => {
  // Since we use stateless JWTs, we just tell the client to discard the token.
  // Optionally log the logout in audit logs if we have the token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await pool.query(
        'INSERT INTO audit_logs (admin_id, action_type, description, ip_address) VALUES (?, "logout", "Admin logged out", ?)',
        [decoded.adminId, ip]
      );
    } catch(e) {
      // Ignored if token invalid
    }
  }
  
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
