// TODO: Connect wishlist routes to database
// TODO: Validate user ownership of wishlist
// TODO: Integrate with shopping cart service
const express = require('express');
const router = express.Router();

// Wishlist Management Routes

// Create a wishlist for a user
router.post('/', async (req, res) => {
  const { userId, wishlistName } = req.body;

  if (!userId || !wishlistName) {
    return res.status(400).json({
      error: 'userId and wishlistName are required'
    });
  }

  return res.status(201).json({
    message: 'Wishlist created successfully',
    userId,
    wishlistName
  });
});

// Add a book to a wishlist
router.post('/:wishlistId/books', async (req, res) => {
  const { wishlistId } = req.params;
  const { bookId } = req.body;

  if (!wishlistId || !bookId) {
    return res.status(400).json({
      error: 'wishlistId and bookId are required'
    });
  }

  return res.status(201).json({
    message: 'Book added to wishlist successfully',
    wishlistId,
    bookId
  });
});

// Remove a book from a wishlist and move it to shopping cart
router.delete('/:wishlistId/books/:bookId', async (req, res) => {
  const { wishlistId, bookId } = req.params;

  if (!wishlistId || !bookId) {
    return res.status(400).json({
      error: 'wishlistId and bookId are required'
    });
  }

  return res.status(200).json({
    message: 'Book removed from wishlist and moved to shopping cart successfully',
    wishlistId,
    bookId
  });
});

// List all books in a wishlist
router.get('/:wishlistId/books', async (req, res) => {
  const { wishlistId } = req.params;

  if (!wishlistId) {
    return res.status(400).json({
      error: 'wishlistId is required'
    });
  }

  return res.status(200).json({
    wishlistId,
    books: []
  });
});

module.exports = router;