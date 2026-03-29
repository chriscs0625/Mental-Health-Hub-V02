const jwt = require('jsonwebtoken');

const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const generateAdminToken = (payload, expiresIn = '2h') => {
  return jwt.sign(payload, process.env.JWT_ADMIN_SECRET, { expiresIn });
};

module.exports = { generateToken, generateAdminToken };
