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
  connectionLimit: 10, // Maximum 10 concurrent connections
  queueLimit: 0, // No limit on queued requests
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Execute a SQL query
 *
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters (prevents SQL injection)
 * @returns {Promise<Array|Object>} Query results
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
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Get a connection from the pool
 * Use this when you need to run multiple queries in a transaction
 *
 * @returns {Promise<Object>} Database connection
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
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error.message);
    throw error;
  }
}

/**
 * Close all connections in the pool
 * Call this when shutting down the server
 */
async function end() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
    throw error;
  }
}

/**
 * Test database connection
 * Returns true if connected, false otherwise
 */
async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
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