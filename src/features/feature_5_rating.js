const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// Helper to normalize db.query
async function runQuery(query, params = []) {
  const result = await db.query(query, params);

  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0]; // mysql2 style
  }

  return result; // normal rows
}

// ==========================
// POST - Add rating
// ==========================
router.post('/ratings', async (req, res, next) => {
  try {
    const { user_id, book_id, rating, comment } = req.body;

    if (!user_id || !book_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating'
      });
    }

    const bookExists = await runQuery(
      'SELECT id FROM books WHERE id = ?',
      [book_id]
    );

    if (!Array.isArray(bookExists) || bookExists.length === 0) {
      return res.status(404).json({
        error: 'Book not found'
      });
    }

    const existing = await runQuery(
      'SELECT id FROM ratings WHERE user_id = ? AND book_id = ?',
      [user_id, book_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Already rated'
      });
    }

    const result = await db.query(
      `INSERT INTO ratings (user_id, book_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [user_id, book_id, rating, comment || null]
    );

    const insertId = result.insertId || result[0]?.insertId;

    res.status(201).json({
      message: 'Rating added',
      rating: {
        id: insertId,
        user_id,
        book_id,
        rating,
        comment
      }
    });

  } catch (err) {
    next(err);
  }
});

// ==========================
// GET - Ratings by book
// ==========================
router.get('/ratings/book/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const ratings = await runQuery(
      `SELECT * FROM ratings WHERE book_id = ? ORDER BY created_at DESC`,
      [bookId]
    );

    res.json({
      book_id: bookId,
      total_reviews: Array.isArray(ratings) ? ratings.length : 0,
      ratings: Array.isArray(ratings) ? ratings : []
    });

  } catch (err) {
    next(err);
  }
});

// ==========================
// PUT - Update rating
// ==========================
router.put('/ratings/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;

    const existing = await runQuery(
      'SELECT id FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (!existing.length) {
      return res.status(404).json({
        error: 'Rating not found'
      });
    }

    const fields = [];
    const values = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Invalid rating'
        });
      }
      fields.push('rating = ?');
      values.push(rating);
    }

    if (comment !== undefined) {
      fields.push('comment = ?');
      values.push(comment);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'Nothing to update'
      });
    }

    values.push(ratingId);

    await db.query(
      `UPDATE ratings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Updated successfully' });

  } catch (err) {
    next(err);
  }
});

// ==========================
// DELETE - Remove rating
// ==========================
router.delete('/ratings/:ratingId', async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const result = await db.query(
      'DELETE FROM ratings WHERE id = ?',
      [ratingId]
    );

    const affected = result.affectedRows || result[0]?.affectedRows;

    if (!affected) {
      return res.status(404).json({
        error: 'Rating not found'
      });
    }

    res.json({ message: 'Deleted successfully' });

  } catch (err) {
    next(err);
  }
});

module.exports = router;