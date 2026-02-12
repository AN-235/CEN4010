/**
 * Geek Text API - Main Application
 * Express.js RESTful API for online bookstore
 * 
 * SETUP INSTRUCTIONS:
 * 1. Make sure you have MySQL running
 * 2. Create database: CREATE DATABASE geektext;
 * 3. Run schema: mysql -u root -p geektext < database/schema.sql
 * 4. Copy .env.example to .env and update with your credentials
 * 5. Run: npm install
 * 6. Run: npm run dev
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS (allows frontend to call API)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// IMPORT ROUTES
// ============================================

// Import route files (create these in src/routes/)
let booksRoutes, usersRoutes, cartRoutes, bookDetailsRoutes, ratingsRoutes, wishlistsRoutes;

try {
  booksRoutes = require('./routes/books');
} catch (err) {
  console.log('⚠️  books.js not found - create src/routes/books.js');
}

try {
  usersRoutes = require('./routes/users');
} catch (err) {
  console.log('⚠️  users.js not found - create src/routes/users.js');
}

try {
  cartRoutes = require('./routes/cart');
} catch (err) {
  console.log('⚠️  cart.js not found - create src/routes/cart.js');
}

try {
  bookDetailsRoutes = require('./routes/bookDetails');
} catch (err) {
  console.log('⚠️  bookDetails.js not found - create src/routes/bookDetails.js');
}

try {
  ratingsRoutes = require('./routes/ratings');
} catch (err) {
  console.log('⚠️  ratings.js not found - create src/routes/ratings.js');
}

try {
  wishlistsRoutes = require('./routes/wishlists');
} catch (err) {
  console.log('⚠️  wishlists.js not found - create src/routes/wishlists.js');
}

// ============================================
// ROOT & HEALTH ENDPOINTS
// ============================================

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Geek Text API',
    version: '1.0.0',
    description: 'Online bookstore API',
    endpoints: {
      health: '/api/health',
      books: '/api/books',
      users: '/api/users',
      cart: '/api/cart',
      admin: '/api/admin',
      ratings: '/api/ratings',
      wishlists: '/api/wishlists'
    },
    documentation: '/api/docs',
    team: 'CEN4010 - Spring 2025'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Geek Text API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// REGISTER ROUTES
// ============================================

// Register each route module if it exists
if (booksRoutes) {
  app.use('/api/books', booksRoutes);
  console.log('✓ Books routes registered at /api/books');
}

if (usersRoutes) {
  app.use('/api/users', usersRoutes);
  console.log('✓ Users routes registered at /api/users');
}

if (cartRoutes) {
  app.use('/api/cart', cartRoutes);
  console.log('✓ Cart routes registered at /api/cart');
}

if (bookDetailsRoutes) {
  app.use('/api/admin', bookDetailsRoutes);
  console.log('✓ Admin routes registered at /api/admin');
}

if (ratingsRoutes) {
  app.use('/api/ratings', ratingsRoutes);
  console.log('✓ Ratings routes registered at /api/ratings');
}

if (wishlistsRoutes) {
  app.use('/api/wishlists', wishlistsRoutes);
  console.log('✓ Wishlists routes registered at /api/wishlists');
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/books',
      'GET /api/users',
      'GET /api/cart',
      'GET /api/admin',
      'GET /api/ratings',
      'GET /api/wishlists'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Send error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION TEST
// ============================================

// Test database connection on startup
const testDatabaseConnection = async () => {
  try {
    const db = require('./utils/database');
    const connection = await db.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('  Make sure MySQL is running and credentials in .env are correct');
    return false;
  }
};

// ============================================
// SERVER START
// ============================================

const startServer = async () => {
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('\n⚠️  Server starting without database connection');
    console.error('   Fix database connection to use API features\n');
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║                                                ║');
    console.log('║          BookStore API Server Running          ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Port:        ${PORT}`);
    console.log(`  URL:         http://localhost:${PORT}`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log('\n  Press Ctrl+C to stop the server\n');
    console.log('════════════════════════════════════════════════\n');
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});

// Start the server
startServer();

// Export app for testing
module.exports = app;