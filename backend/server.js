// Express server with CORS, JSON body parser, helmet, morgan,
// rate limiter, and route mounting for customer and admin routes

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Route Imports
const customerAuthRoutes = require('./src/routes/customer/auth');
const adminAuthRoutes = require('./src/routes/admin/auth');
const customerProductRoutes = require('./src/routes/customer/products');
const adminProductRoutes = require('./src/routes/admin/products');

// Mount Routes
app.use('/api/auth', customerAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/products', customerProductRoutes);
app.use('/api/admin/products', adminProductRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Mental Balance Hub API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
