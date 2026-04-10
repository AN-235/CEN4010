const db = require('../utils/database');

let initializationPromise = null;

async function ensureWishlistTables() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS wishlists (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_wishlist_name (user_id, name)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS wishlist_books (
          wishlist_id INT NOT NULL,
          book_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (wishlist_id, book_id)
        )
      `);
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function getWishlistById(wishlistId) {
  const wishlists = await db.query(
    'SELECT id, user_id, name FROM wishlists WHERE id = ?',
    [wishlistId]
  );

  return wishlists[0] || null;
}

async function assertUserExists(userId) {
  const users = await db.query('SELECT id FROM users WHERE id = ?', [userId]);

  if (users.length === 0) {
    const error = new Error(`User with ID ${userId} does not exist`);
    error.status = 404;
    throw error;
  }
}

async function assertBookExists(bookId) {
  const books = await db.query('SELECT id FROM books WHERE id = ?', [bookId]);

  if (books.length === 0) {
    const error = new Error(`Book with ID ${bookId} does not exist`);
    error.status = 404;
    throw error;
  }
}

async function createWishlist(userId, wishlistName) {
  await ensureWishlistTables();
  await assertUserExists(userId);

  const trimmedName = wishlistName.trim();

  if (!trimmedName) {
    const error = new Error('wishlistName cannot be empty');
    error.status = 400;
    throw error;
  }

  const wishlistCount = await db.query(
    'SELECT COUNT(*) AS total FROM wishlists WHERE user_id = ?',
    [userId]
  );

  if (wishlistCount[0].total >= 3) {
    const error = new Error('A user can only have up to 3 wishlists');
    error.status = 409;
    throw error;
  }

  const existingWishlist = await db.query(
    'SELECT id FROM wishlists WHERE user_id = ? AND name = ?',
    [userId, trimmedName]
  );

  if (existingWishlist.length > 0) {
    const error = new Error('Wishlist name must be unique for this user');
    error.status = 409;
    throw error;
  }

  const result = await db.query(
    'INSERT INTO wishlists (user_id, name) VALUES (?, ?)',
    [userId, trimmedName]
  );

  return result.insertId;
}

async function addBookToWishlist(wishlistId, bookId) {
  await ensureWishlistTables();
  await assertBookExists(bookId);

  const wishlist = await getWishlistById(wishlistId);

  if (!wishlist) {
    const error = new Error(`Wishlist with ID ${wishlistId} does not exist`);
    error.status = 404;
    throw error;
  }

  const existingEntry = await db.query(
    'SELECT wishlist_id FROM wishlist_books WHERE wishlist_id = ? AND book_id = ?',
    [wishlistId, bookId]
  );

  if (existingEntry.length > 0) {
    const error = new Error('Book is already in this wishlist');
    error.status = 409;
    throw error;
  }

  await db.query(
    'INSERT INTO wishlist_books (wishlist_id, book_id) VALUES (?, ?)',
    [wishlistId, bookId]
  );
}

async function moveBookToCart(wishlistId, bookId) {
  await ensureWishlistTables();
  const wishlist = await getWishlistById(wishlistId);

  if (!wishlist) {
    const error = new Error(`Wishlist with ID ${wishlistId} does not exist`);
    error.status = 404;
    throw error;
  }

  await assertBookExists(bookId);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [wishlistBookRows] = await connection.query(
      'SELECT wishlist_id FROM wishlist_books WHERE wishlist_id = ? AND book_id = ?',
      [wishlistId, bookId]
    );

    if (wishlistBookRows.length === 0) {
      const error = new Error('Book is not in this wishlist');
      error.status = 404;
      throw error;
    }

    await connection.query(
      'DELETE FROM wishlist_books WHERE wishlist_id = ? AND book_id = ?',
      [wishlistId, bookId]
    );

    const [cartItemRows] = await connection.query(
      'SELECT user_id, book_id FROM cart_items WHERE user_id = ? AND book_id = ?',
      [wishlist.user_id, bookId]
    );

    if (cartItemRows.length > 0) {
      await connection.query(
        'UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND book_id = ?',
        [wishlist.user_id, bookId]
      );
    } else {
      await connection.query(
        'INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)',
        [wishlist.user_id, bookId, 1]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listWishlistBooks(wishlistId) {
  await ensureWishlistTables();
  const wishlist = await getWishlistById(wishlistId);

  if (!wishlist) {
    const error = new Error(`Wishlist with ID ${wishlistId} does not exist`);
    error.status = 404;
    throw error;
  }

  const books = await db.query(
    `SELECT
      b.id,
      b.isbn,
      b.title,
      b.description,
      b.price,
      b.genre,
      b.publisher,
      b.year_published,
      b.copies_sold,
      wb.created_at AS added_at
     FROM wishlist_books wb
     JOIN books b ON b.id = wb.book_id
     WHERE wb.wishlist_id = ?
     ORDER BY wb.created_at DESC`,
    [wishlistId]
  );

  return books.map((book) => ({
    id: book.id,
    isbn: book.isbn,
    title: book.title,
    description: book.description,
    price: book.price !== null ? parseFloat(book.price) : null,
    genre: book.genre,
    publisher: book.publisher,
    year_published: book.year_published,
    copies_sold: book.copies_sold,
    added_at: book.added_at
  }));
}

module.exports = {
  createWishlist,
  addBookToWishlist,
  moveBookToCart,
  listWishlistBooks
};
