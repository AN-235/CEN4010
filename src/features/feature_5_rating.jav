/**
 * Feature 5: Ratings & Comments (User)
 * User endpoints for rating books and adding comments
 * 
 * Requirements:
 * - Add a rating and comment to a book
 * - Get all ratings for a book
 * - Update rating/comment
 * - Delete rating/comment
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// ============================================
// RATING ENDPOINTS
// ============================================

/**
 * POST /api/ratings
 * Add a rating and comment
 * 
 * Body: {
 *   user_id: number,
 *   book_id: number,
 *   rating: number (1–5),
 *   comment: string
 * }
 */
router.post('/ratings', async (req, res, next) => {
  try {
    const { user_id, book_id, rating, comment } = req.body;

    // Validate required fields
    if (!user_id || !book_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'book_id', 'rating']
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if book exists
    const bookExists = await db.query(
      'SELECT id FROM books WHERE id = ?',
      [book_id]
    );

    if (bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `Book with ID ${book_id} does not exist`
      });
    }

    // Check if user already rated this book
    const existing = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND book_id = ?',
      [user_id, book_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Duplicate rating',
        message: 'User has already rated this book'
      });
    }

    // Insert rating
    const result = await db.query(
      `INSERT INTO ratings (user_id, book_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [user_id, book_id, rating, comment || null]
    );

    res.status(201).json({
      message: 'Rating added successfully',
      rating: {
        id: result.insertId,
        user_id,
        book_id,
        rating,
        comment
      }
    });

  } catch (error) {
    next(error);
  }
});


/**
 * GET /api/ratings/book/:bookId
 * Get all ratings for a book
 */
router.get('/ratings/book/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const ratings = await db.query(
      `SELECT 
        r.id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at
       FROM ratings r
       WHERE r.book_id = ?
       ORDER BY r.created_at DESC`,
      [bookId]
    );

    res.json({
      book_id: bookId,
      total_reviews: ratings.length,
      ratings: ratings.map(r => ({
        id: r.id,
        user_id: r.user_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      }))
    });

  } catch (error) {
    next(error);
  }
});


/**
 * PUT /api/ratings/:ratingId
 * Update rating/comment
 * 
 * Body: {
 *   rating?: number,
 *   comment?: string
 * }
 */
router.put('/ratings/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const updates = req.body;

    // Check if rating exists
    const existing = await db.query(
      'SELECT id FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Rating not found',
        message: `No rating found with ID ${ratingId}`
      });
    }

    // Validate rating if provided
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Dynamic update
    const allowedFields = ['rating', 'comment'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        allowedFields
      });
    }

    values.push(ratingId);

    await db.query(
      `UPDATE ratings SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      message: 'Rating updated successfully',
      rating_id: ratingId
    });

  } catch (error) {
    next(error);
  }
});


/**
 * DELETE /api/ratings/:ratingId
 * Delete a rating
 */
router.delete('/ratings/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const result = await db.query(
      'DELETE FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Rating not found',
        message: `No rating found with ID ${ratingId}`
      });
    }

    res.json({
      message: 'Rating deleted successfully',
      rating_id: ratingId
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;