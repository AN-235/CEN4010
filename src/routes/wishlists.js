const express = require('express');
const router = express.Router();
const wishlistService = require('../services/wishlistService');

router.post('/', async (req, res, next) => {
  try {
    const { userId, wishlistName } = req.body;

    if (!userId || !wishlistName) {
      return res.status(400).json({
        error: 'userId and wishlistName are required'
      });
    }

    const wishlistId = await wishlistService.createWishlist(userId, wishlistName);
    res.location(`/api/wishlists/${wishlistId}/books`);
    return res.status(201).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/:wishlistId/books', async (req, res, next) => {
  try {
    const { wishlistId } = req.params;
    const { bookId } = req.body;

    if (!wishlistId || !bookId) {
      return res.status(400).json({
        error: 'wishlistId and bookId are required'
      });
    }

    await wishlistService.addBookToWishlist(wishlistId, bookId);
    return res.status(201).send();
  } catch (error) {
    return next(error);
  }
});

router.delete('/:wishlistId/books/:bookId', async (req, res, next) => {
  try {
    const { wishlistId, bookId } = req.params;

    if (!wishlistId || !bookId) {
      return res.status(400).json({
        error: 'wishlistId and bookId are required'
      });
    }

    await wishlistService.moveBookToCart(wishlistId, bookId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/:wishlistId/books', async (req, res, next) => {
  try {
    const { wishlistId } = req.params;

    if (!wishlistId) {
      return res.status(400).json({
        error: 'wishlistId is required'
      });
    }

    const books = await wishlistService.listWishlistBooks(wishlistId);
    return res.status(200).json(books);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
