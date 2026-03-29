const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/db');
const generateOTP = require('../../utils/generateOTP');
const { generateToken } = require('../../utils/generateToken');
const sendEmail = require('../../utils/sendEmail');
const jwt = require('jsonwebtoken');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || (!email && !phone) || !password || password.length < 8) {
    return res.status(400).json({ message: 'Invalid input. Name, email or phone, and a password of at least 8 characters are required.' });
  }

  try {
    // Check if email/phone exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR phone = ?', [email || null, phone || null]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or phone already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, is_verified) VALUES (?, ?, ?, ?, FALSE)',
      [full_name, email || null, phone || null, password_hash]
    );

    const userId = result.insertId;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      'INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?, ?, "email_verify", ?)',
      [userId, otp, expiresAt]
    );

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Verify your Mental Balance Hub account',
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });
    }

    res.status(201).json({ message: 'OTP sent', userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });

  try {
    const [users] = await pool.query('SELECT email FROM users WHERE id = ? AND is_verified = FALSE', [userId]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found or already verified' });
    }

    const email = users[0].email;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this user
    await pool.query('UPDATE otp_codes SET used = TRUE WHERE user_id = ? AND type = "email_verify"', [userId]);

    await pool.query(
      'INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES (?, ?, "email_verify", ?)',
      [userId, otp, expiresAt]
    );

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Your new verification code',
        html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
      });
    }

    res.json({ message: 'New OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: 'Missing userId or code' });

  try {
    const [otps] = await pool.query(
      'SELECT id FROM otp_codes WHERE user_id = ? AND code = ? AND type = "email_verify" AND used = FALSE AND expires_at > NOW()',
      [userId, code]
    );

    if (otps.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otps[0].id]);
    await pool.query('UPDATE users SET is_verified = TRUE WHERE id = ?', [userId]);

    const [user] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);

    const token = generateToken({ userId, email: user[0].email, role: 'customer' });
    res.json({ message: 'Email verified successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone
  if (!identifier || !password) return res.status(400).json({ message: 'Missing credentials' });

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Incorrect credentials' }); // Intentionally vague
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }
    
    if (user.is_banned) {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: 'customer' });
    delete user.password_hash; // Don't send hash
    
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ message: 'Missing identifier' });

  try {
    const [users] = await pool.query('SELECT id, email FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);
    
    if (users.length > 0) {
      const user = users[0];
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, resetToken, expiresAt]
      );

      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Reset your password',
          html: `<p>Click here to reset your password: <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a></p>`
        });
      }
    }
    // Always return 200 to prevent email enumeration
    res.status(200).json({ message: 'If that account exists, a reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Invalid input. Password must be at least 8 characters.' });
  }

  try {
    const [tokens] = await pool.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Link expired or invalid' });
    }

    const { id: tokenId, user_id } = tokens[0];
    const password_hash = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [tokenId]);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me (Basic middleware check inline for now, ideally moved to middleware folder)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') return res.status(403).json({ message: 'Not authorized' });

    const [users] = await pool.query('SELECT id, full_name, email, phone, avatar_url, is_verified, is_banned FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ user: users[0] });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
