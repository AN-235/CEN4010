const express = require('express');
const request = require('supertest');

jest.mock('../src/services/wishlistService', () => ({
  createWishlist: jest.fn(),
  addBookToWishlist: jest.fn(),
  moveBookToCart: jest.fn(),
  listWishlistBooks: jest.fn()
}));

const wishlistService = require('../src/services/wishlistService');
const wishlistRouter = require('../src/routes/wishlists');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wishlists', wishlistRouter);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
  });
  return app;
}

describe('wishlist routes', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  test('POST /api/wishlists creates a wishlist and sets the Location header', async () => {
    wishlistService.createWishlist.mockResolvedValue(7);

    const response = await request(app)
      .post('/api/wishlists')
      .send({ userId: 1, wishlistName: 'Favorites' });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe('/api/wishlists/7/books');
    expect(wishlistService.createWishlist).toHaveBeenCalledWith(1, 'Favorites');
  });

  test('POST /api/wishlists/:wishlistId/books validates required input', async () => {
    const response = await request(app)
      .post('/api/wishlists/3/books')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'wishlistId and bookId are required'
    });
  });

  test('DELETE /api/wishlists/:wishlistId/books/:bookId returns 204 on success', async () => {
    wishlistService.moveBookToCart.mockResolvedValue();

    const response = await request(app)
      .delete('/api/wishlists/3/books/12');

    expect(response.status).toBe(204);
    expect(wishlistService.moveBookToCart).toHaveBeenCalledWith('3', '12');
  });

  test('GET /api/wishlists/:wishlistId/books returns the book list', async () => {
    wishlistService.listWishlistBooks.mockResolvedValue([
      { id: 12, title: 'Clean Code' }
    ]);

    const response = await request(app)
      .get('/api/wishlists/3/books');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 12, title: 'Clean Code' }]);
    expect(wishlistService.listWishlistBooks).toHaveBeenCalledWith('3');
  });
});
