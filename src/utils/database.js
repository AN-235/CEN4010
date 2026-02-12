/**
 * Database Connection Pool
 * MySQL connection using mysql2 with promise wrapper
 * 
 * This file handles all database connections for the API
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
// A pool maintains multiple connections and reuses them efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'geektext',
  waitForConnections: true,
  connectionLimit: 10,           // Maximum 10 concurrent connections
  queueLimit: 0,                 // No limit on queued requests
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Execute a SQL query
 * 
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters (prevents SQL injection)
 * @returns {Promise} Query results
 * 
 * @example
 * const books = await query('SELECT * FROM books WHERE genre = ?', ['Fiction']);
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
}

/**
 * Get a connection from the pool
 * Use this when you need to run multiple queries in a transaction
 * 
 * @returns {Promise} Database connection
 * 
 * @example
 * const connection = await getConnection();
 * try {
 *   await connection.beginTransaction();
 *   await connection.query('INSERT INTO ...');
 *   await connection.query('UPDATE ...');
 *   await connection.commit();
 * } catch (err) {
 *   await connection.rollback();
 * } finally {
 *   connection.release();
 * }
 */
async function getConnection() {
  return await pool.getConnection();
}

/**
 * Close all connections in the pool
 * Call this when shutting down the server
 */
async function end() {
  await pool.end();
  console.log('Database pool closed');
}

/**
 * Test database connection
 * Returns true if connected, false otherwise
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Export functions for use in other files
module.exports = {
  pool,          // The connection pool itself
  query,         // Execute a single query
  getConnection, // Get a connection for transactions
  end,           // Close all connections
  testConnection // Test if database is connected
};