const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// Helper that works whether db.query returns rows
// or [rows, fields]
async function runQuery(query, params = []) {
  const result = await db.query(query, params);

  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
}

/**
 * POST /api/ratings/books/:bookId
 */
router.post('/books/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { user_id, rating, comment } = req.body;

    if (!user_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'rating']
      });
    }

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({
        error: 'Invalid book ID',
        message: 'bookId must be a valid number'
      });
    }

    if (isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    const bookExists = await runQuery(
      'SELECT id, title FROM books WHERE id = ?',
      [bookId]
    );

    if (!Array.isArray(bookExists) || bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `Book with ID ${bookId} does not exist`
      });
    }

    const existingRating = await runQuery(
      'SELECT id FROM ratings WHERE user_id = ? AND book_id = ?',
      [user_id, bookId]
    );

    if (Array.isArray(existingRating) && existingRating.length > 0) {
      return res.status(409).json({
        error: 'Duplicate rating',
        message: 'User has already rated this book'
      });
    }

    const result = await db.query(
      `INSERT INTO ratings (user_id, book_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [user_id, bookId, rating, comment || null]
    );

    const insertId = result.insertId || (Array.isArray(result) && result[0] ? result[0].insertId : null);

    return res.status(201).json({
      message: 'Rating added successfully',
      rating: {
        id: insertId,
        user_id: Number(user_id),
        book_id: Number(bookId),
        rating: Number(rating),
        comment: comment || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ratings/books/:bookId
 */
router.get('/books/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({
        error: 'Invalid book ID',
        message: 'bookId must be a valid number'
      });
    }

    const bookExists = await runQuery(
      'SELECT id, title FROM books WHERE id = ?',
      [bookId]
    );

    if (!Array.isArray(bookExists) || bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `Book with ID ${bookId} does not exist`
      });
    }

    const ratings = await runQuery(
      `SELECT
          r.id,
          r.user_id,
          r.book_id,
          r.rating,
          r.comment,
          r.created_at
       FROM ratings r
       WHERE r.book_id = ?
       ORDER BY r.created_at DESC`,
      [bookId]
    );

    return res.status(200).json({
      message: 'Ratings retrieved successfully',
      book: {
        id: bookExists[0].id,
        title: bookExists[0].title
      },
      total_reviews: Array.isArray(ratings) ? ratings.length : 0,
      ratings: Array.isArray(ratings)
        ? ratings.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            book_id: r.book_id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at
          }))
        : []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/ratings/:ratingId
 */
router.put('/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;

    if (!ratingId || isNaN(ratingId)) {
      return res.status(400).json({
        error: 'Invalid rating ID',
        message: 'ratingId must be a valid number'
      });
    }

    const existingRating = await runQuery(
      'SELECT id, user_id, book_id FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (!Array.isArray(existingRating) || existingRating.length === 0) {
      return res.status(404).json({
        error: 'Rating not found',
        message: `No rating found with ID ${ratingId}`
      });
    }

    if (
      rating !== undefined &&
      (isNaN(rating) || Number(rating) < 1 || Number(rating) > 5)
    ) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(Number(rating));
    }

    if (comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(comment);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        allowedFields: ['rating', 'comment']
      });
    }

    updateValues.push(ratingId);

    await db.query(
      `UPDATE ratings
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
      updateValues
    );

    return res.status(200).json({
      message: 'Rating updated successfully',
      rating_id: Number(ratingId)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/ratings/:ratingId
 */
router.delete('/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    if (!ratingId || isNaN(ratingId)) {
      return res.status(400).json({
        error: 'Invalid rating ID',
        message: 'ratingId must be a valid number'
      });
    }

    const result = await db.query(
      'DELETE FROM ratings WHERE id = ?',
      [ratingId]
    );

    const deleteResult = Array.isArray(result) && !result.affectedRows ? result[0] : result;

    if (!deleteResult || deleteResult.affectedRows === 0) {
      return res.status(404).json({
        error: 'Rating not found',
        message: `No rating found with ID ${ratingId}`
      });
    }

    return res.status(200).json({
      message: 'Rating deleted successfully',
      rating_id: Number(ratingId)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;