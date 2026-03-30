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
 * POST /api/ratings/books/:bookId
 * Add a rating and comment to a book
 * 
 * Body: {
 *   user_id: number,
 *   rating: number,
 *   comment: string
 * }
 */
router.post('/books/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { user_id, rating, comment } = req.body;

    // Validate required fields
    if (!user_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'rating']
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if book exists
    const bookExists = await db.query(
      'SELECT id FROM books WHERE id = ?',
      [bookId]
    );

    if (bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `Book with ID ${bookId} does not exist`
      });
    }

    // Check if user already rated this book
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND book_id = ?',
      [user_id, bookId]
    );

    if (existingRating.length > 0) {
      return res.status(409).json({
        error: 'Duplicate rating',
        message: 'User has already rated this book'
      });
    }

    // Insert rating
    const result = await db.query(
      `INSERT INTO ratings (user_id, book_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [user_id, bookId, rating, comment || null]
    );

    res.status(201).json({
      message: 'Rating added successfully',
      rating: {
        id: result.insertId,
        user_id,
        book_id: parseInt(bookId),
        rating,
        comment: comment || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ratings/books/:bookId
 * Get all ratings for a book
 */
router.get('/books/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    // Check if book exists
    const bookExists = await db.query(
      'SELECT id, title FROM books WHERE id = ?',
      [bookId]
    );

    if (bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `Book with ID ${bookId} does not exist`
      });
    }

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
      book: {
        id: bookExists[0].id,
        title: bookExists[0].title
      },
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
router.put('/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const updates = req.body;

    // Check if rating exists
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (existingRating.length === 0) {
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

    // Build dynamic update query
    const allowedFields = ['rating', 'comment'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        allowedFields
      });
    }

    updateValues.push(ratingId);

    await db.query(
      `UPDATE ratings SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
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
router.delete('/:ratingId', async (req, res, next) => {
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