const express = require('express');
const router = express.Router();
const { query } = require('../utils/database');

/**
 * Ratings Routes
 * Base path: /api/ratings
 *
 * Assumed table structure:
 * ratings(
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   book_id INT NOT NULL,
 *   user_id INT NOT NULL,
 *   rating INT NOT NULL,
 *   comment TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * )
 */

/**
 * Helper: validate positive integer
 */ra.
function isValidId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

/**
 * GET /api/ratings/book/:bookId
 * Get all ratings/comments for a specific book
 */
router.get('/book/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!isValidId(bookId)) {
      return res.status(400).json({
        error: 'Invalid Book ID',
        message: 'Book ID must be a positive integer'
      });
    }

    // Check if book exists
    const books = await query(
      'SELECT book_id, title FROM books WHERE book_id = ?',
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: 'The requested book does not exist'
      });
    }

    const reviews = await query(
      `
      SELECT 
        r.id,
        r.book_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at
      FROM ratings r
      WHERE r.book_id = ?
      ORDER BY r.created_at DESC
      `,
      [bookId]
    );

    const summary = await query(
      `
      SELECT 
        COUNT(*) AS total_reviews,
        ROUND(AVG(rating), 1) AS average_rating
      FROM ratings
      WHERE book_id = ?
      `,
      [bookId]
    );

    res.json({
      message: 'Ratings retrieved successfully',
      book: books[0],
      summary: {
        totalReviews: summary[0].total_reviews || 0,
        averageRating: summary[0].average_rating || 0
      },
      ratings: reviews
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ratings/book/:bookId/summary
 * Get only rating summary for a book
 */
router.get('/book/:bookId/summary', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!isValidId(bookId)) {
      return res.status(400).json({
        error: 'Invalid Book ID',
        message: 'Book ID must be a positive integer'
      });
    }

    const books = await query(
      'SELECT book_id, title FROM books WHERE book_id = ?',
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: 'The requested book does not exist'
      });
    }

    const summary = await query(
      `
      SELECT 
        COUNT(*) AS total_reviews,
        ROUND(AVG(rating), 1) AS average_rating
      FROM ratings
      WHERE book_id = ?
      `,
      [bookId]
    );

    res.json({
      message: 'Rating summary retrieved successfully',
      book: books[0],
      totalReviews: summary[0].total_reviews || 0,
      averageRating: summary[0].average_rating || 0
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ratings
 * Create a new rating/comment
 * Body:
 * {
 *   "book_id": 1,
 *   "user_id": 2,
 *   "rating": 5,
 *   "comment": "Great book!"
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { book_id, user_id, rating, comment } = req.body;

    // Validation
    if (!isValidId(book_id)) {
      return res.status(400).json({
        error: 'Invalid Book ID',
        message: 'book_id must be a positive integer'
      });
    }

    if (!isValidId(user_id)) {
      return res.status(400).json({
        error: 'Invalid User ID',
        message: 'user_id must be a positive integer'
      });
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        error: 'Invalid Rating',
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (comment !== undefined && typeof comment !== 'string') {
      return res.status(400).json({
        error: 'Invalid Comment',
        message: 'Comment must be a string'
      });
    }

    const trimmedComment = comment ? comment.trim() : '';

    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        error: 'Comment Too Long',
        message: 'Comment must be 1000 characters or less'
      });
    }

    // Check if book exists
    const books = await query(
      'SELECT book_id, title FROM books WHERE book_id = ?',
      [book_id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: 'Cannot rate a book that does not exist'
      });
    }

    // Check if user exists
    const users = await query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'Cannot submit rating for a user that does not exist'
      });
    }

    // Optional rule: one rating per user per book
    const existing = await query(
      'SELECT id FROM ratings WHERE book_id = ? AND user_id = ?',
      [book_id, user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Rating Already Exists',
        message: 'This user has already rated this book. Use update instead.'
      });
    }

    const result = await query(
      `
      INSERT INTO ratings (book_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      `,
      [book_id, user_id, numericRating, trimmedComment || null]
    );

    const newRating = await query(
      `
      SELECT 
        id,
        book_id,
        user_id,
        rating,
        comment,
        created_at,
        updated_at
      FROM ratings
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Rating and comment submitted successfully',
      rating: newRating[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/ratings/:ratingId
 * Update an existing rating/comment
 */
router.put('/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;

    if (!isValidId(ratingId)) {
      return res.status(400).json({
        error: 'Invalid Rating ID',
        message: 'Rating ID must be a positive integer'
      });
    }

    const existing = await query(
      'SELECT * FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Rating Not Found',
        message: 'The rating you are trying to update does not exist'
      });
    }

    const updates = [];
    const params = [];

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          error: 'Invalid Rating',
          message: 'Rating must be an integer between 1 and 5'
        });
      }

      updates.push('rating = ?');
      params.push(numericRating);
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string') {
        return res.status(400).json({
          error: 'Invalid Comment',
          message: 'Comment must be a string'
        });
      }

      const trimmedComment = comment.trim();

      if (trimmedComment.length > 1000) {
        return res.status(400).json({
          error: 'Comment Too Long',
          message: 'Comment must be 1000 characters or less'
        });
      }

      updates.push('comment = ?');
      params.push(trimmedComment || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No Updates Provided',
        message: 'Provide at least one field to update: rating or comment'
      });
    }

    params.push(ratingId);

    await query(
      `
      UPDATE ratings
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      params
    );

    const updated = await query(
      `
      SELECT 
        id,
        book_id,
        user_id,
        rating,
        comment,
        created_at,
        updated_at
      FROM ratings
      WHERE id = ?
      `,
      [ratingId]
    );

    res.json({
      message: 'Rating updated successfully',
      rating: updated[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/ratings/:ratingId
 * Delete a rating/comment
 */
router.delete('/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    if (!isValidId(ratingId)) {
      return res.status(400).json({
        error: 'Invalid Rating ID',
        message: 'Rating ID must be a positive integer'
      });
    }

    const existing = await query(
      'SELECT id FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Rating Not Found',
        message: 'The rating you are trying to delete does not exist'
      });
    }

    await query(
      'DELETE FROM ratings WHERE id = ?',
      [ratingId]
    );

    res.json({
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;