/**
 * Feature 4: Book Details (Admin)
 * Admin endpoints for creating and managing books and authors
 * 
 * Requirements:
 * - Create a book with ISBN, name, description, price, author, genre, publisher, year, copies sold
 * - Retrieve book details by ISBN
 * - Create an author with first name, last name, biography, publisher
 * - Retrieve list of books by an author
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// ============================================
// BOOK ENDPOINTS
// ============================================

/**
 * POST /api/admin/books
 * Create a new book
 * 
 * Body: {
 *   isbn: string,
 *   title: string,
 *   description: string,
 *   price: number,
 *   author_id: number,
 *   genre: string,
 *   publisher: string,
 *   year_published: number,
 *   copies_sold: number (optional, default: 0)
 * }
 */
router.post('/books', async (req, res, next) => {
  try {
    const {
      isbn,
      title,
      description,
      price,
      author_id,
      genre,
      publisher,
      year_published,
      copies_sold = 0
    } = req.body;

    // Validate required fields
    if (!isbn || !title || !description || !price || !author_id || !genre || !publisher || !year_published) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['isbn', 'title', 'description', 'price', 'author_id', 'genre', 'publisher', 'year_published']
      });
    }

    // Validate price is positive
    if (price <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'Price must be greater than 0'
      });
    }

    // Validate year_published is reasonable
    const currentYear = new Date().getFullYear();
    if (year_published < 1000 || year_published > currentYear + 1) {
      return res.status(400).json({
        error: 'Invalid year',
        message: `Year must be between 1000 and ${currentYear + 1}`
      });
    }

    // Check if ISBN already exists
    const existingBook = await db.query(
      'SELECT id FROM books WHERE isbn = ?',
      [isbn]
    );

    if (existingBook.length > 0) {
      return res.status(409).json({
        error: 'Duplicate ISBN',
        message: 'A book with this ISBN already exists'
      });
    }

    // Check if author exists
    const authorExists = await db.query(
      'SELECT id FROM authors WHERE id = ?',
      [author_id]
    );

    if (authorExists.length === 0) {
      return res.status(404).json({
        error: 'Author not found',
        message: `Author with ID ${author_id} does not exist`
      });
    }

    // Insert book
    const result = await db.query(
      `INSERT INTO books 
       (isbn, title, description, price, author_id, genre, publisher, year_published, copies_sold) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, description, price, author_id, genre, publisher, year_published, copies_sold]
    );

    res.status(201).json({
      message: 'Book created successfully',
      book: {
        id: result.insertId,
        isbn,
        title,
        description,
        price,
        author_id,
        genre,
        publisher,
        year_published,
        copies_sold
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/books/:isbn
 * Get book details by ISBN
 */
router.get('/books/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;

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
        b.created_at,
        b.updated_at,
        a.id as author_id,
        a.first_name,
        a.last_name,
        a.biography,
        a.publisher as author_publisher
       FROM books b
       LEFT JOIN authors a ON b.author_id = a.id
       WHERE b.isbn = ?`,
      [isbn]
    );

    if (books.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `No book found with ISBN ${isbn}`
      });
    }

    const book = books[0];

    // Format response
    res.json({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      description: book.description,
      price: parseFloat(book.price),
      genre: book.genre,
      publisher: book.publisher,
      year_published: book.year_published,
      copies_sold: book.copies_sold,
      author: {
        id: book.author_id,
        first_name: book.first_name,
        last_name: book.last_name,
        full_name: `${book.first_name} ${book.last_name}`,
        biography: book.biography,
        publisher: book.author_publisher
      },
      created_at: book.created_at,
      updated_at: book.updated_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/books/:isbn
 * Update book details
 * 
 * Body: {
 *   title?: string,
 *   description?: string,
 *   price?: number,
 *   genre?: string,
 *   publisher?: string,
 *   year_published?: number,
 *   copies_sold?: number
 * }
 */
router.put('/books/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const updates = req.body;

    // Check if book exists
    const existingBook = await db.query(
      'SELECT id FROM books WHERE isbn = ?',
      [isbn]
    );

    if (existingBook.length === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `No book found with ISBN ${isbn}`
      });
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'Price must be greater than 0'
      });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'description', 'price', 'genre', 'publisher', 'year_published', 'copies_sold'];
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

    // Add ISBN to values for WHERE clause
    updateValues.push(isbn);

    await db.query(
      `UPDATE books SET ${updateFields.join(', ')} WHERE isbn = ?`,
      updateValues
    );

    res.json({
      message: 'Book updated successfully',
      isbn
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/books/:isbn
 * Delete a book
 */
router.delete('/books/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;

    const result = await db.query(
      'DELETE FROM books WHERE isbn = ?',
      [isbn]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Book not found',
        message: `No book found with ISBN ${isbn}`
      });
    }

    res.json({
      message: 'Book deleted successfully',
      isbn
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AUTHOR ENDPOINTS
// ============================================

/**
 * POST /api/admin/authors
 * Create a new author
 * 
 * Body: {
 *   first_name: string,
 *   last_name: string,
 *   biography: string,
 *   publisher: string
 * }
 */

// Add this endpoint (around line 320)
router.get('/authors', async (req, res, next) => {
  try {
    const authors = await db.query(
      'SELECT id, first_name, last_name, publisher FROM authors ORDER BY last_name, first_name'
    );
    
    res.json(authors.map(author => ({
      id: author.id,
      first_name: author.first_name,
      last_name: author.last_name,
      full_name: `${author.first_name} ${author.last_name}`,
      publisher: author.publisher
    })));
  } catch (error) {
    next(error);
  }
});

router.post('/authors', async (req, res, next) => {
  try {
    const { first_name, last_name, biography, publisher } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !biography || !publisher) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'biography', 'publisher']
      });
    }

    // Insert author
    const result = await db.query(
      `INSERT INTO authors (first_name, last_name, biography, publisher) 
       VALUES (?, ?, ?, ?)`,
      [first_name, last_name, biography, publisher]
    );

    res.status(201).json({
      message: 'Author created successfully',
      author: {
        id: result.insertId,
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        biography,
        publisher
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/authors/:authorId
 * Get author details
 */
router.get('/authors/:authorId', async (req, res, next) => {
  try {
    const { authorId } = req.params;

    const authors = await db.query(
      `SELECT * FROM authors WHERE id = ?`,
      [authorId]
    );

    if (authors.length === 0) {
      return res.status(404).json({
        error: 'Author not found',
        message: `No author found with ID ${authorId}`
      });
    }

    const author = authors[0];

    res.json({
      id: author.id,
      first_name: author.first_name,
      last_name: author.last_name,
      full_name: `${author.first_name} ${author.last_name}`,
      biography: author.biography,
      publisher: author.publisher,
      created_at: author.created_at,
      updated_at: author.updated_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/authors/:authorId/books
 * Get all books by an author
 */
router.get('/authors/:authorId/books', async (req, res, next) => {
  try {
    const { authorId } = req.params;

    // Check if author exists
    const authorExists = await db.query(
      'SELECT id, first_name, last_name FROM authors WHERE id = ?',
      [authorId]
    );

    if (authorExists.length === 0) {
      return res.status(404).json({
        error: 'Author not found',
        message: `No author found with ID ${authorId}`
      });
    }

    const author = authorExists[0];

    // Get all books by this author
    const books = await db.query(
      `SELECT 
        id,
        isbn,
        title,
        description,
        price,
        genre,
        publisher,
        year_published,
        copies_sold,
        created_at
       FROM books
       WHERE author_id = ?
       ORDER BY year_published DESC, title ASC`,
      [authorId]
    );

    res.json({
      author: {
        id: author.id,
        name: `${author.first_name} ${author.last_name}`
      },
      total_books: books.length,
      books: books.map(book => ({
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        description: book.description,
        price: parseFloat(book.price),
        genre: book.genre,
        publisher: book.publisher,
        year_published: book.year_published,
        copies_sold: book.copies_sold,
        created_at: book.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/authors/:authorId
 * Update author details
 */
router.put('/authors/:authorId', async (req, res, next) => {
  try {
    const { authorId } = req.params;
    const updates = req.body;

    // Check if author exists
    const authorExists = await db.query(
      'SELECT id FROM authors WHERE id = ?',
      [authorId]
    );

    if (authorExists.length === 0) {
      return res.status(404).json({
        error: 'Author not found',
        message: `No author found with ID ${authorId}`
      });
    }

    // Build dynamic update query
    const allowedFields = ['first_name', 'last_name', 'biography', 'publisher'];
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

    updateValues.push(authorId);

    await db.query(
      `UPDATE authors SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      message: 'Author updated successfully',
      author_id: authorId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/books
 * Get all books with optional filters
 * 
 * Query params:
 * - genre: filter by genre
 * - publisher: filter by publisher
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 */
router.get('/books', async (req, res, next) => {
  try {
    const {
      genre,
      publisher,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (genre) {
      conditions.push('b.genre LIKE ?');
      params.push(`%${genre}%`);
    }

    if (publisher) {
      conditions.push('b.publisher LIKE ?');
      params.push(`%${publisher}%`);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM books b 
      ${whereClause}
    `;
    const [{ total }] = await db.query(countQuery, params);

    // Get paginated books
    const booksQuery = `
      SELECT 
        b.id,
        b.isbn,
        b.title,
        b.price,
        b.genre,
        b.publisher,
        b.year_published,
        b.copies_sold,
        a.first_name,
        a.last_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const books = await db.query(booksQuery, [...params, parseInt(limit), offset]);

    res.json({
      books: books.map(book => ({
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        price: parseFloat(book.price),
        genre: book.genre,
        publisher: book.publisher,
        year_published: book.year_published,
        copies_sold: book.copies_sold,
        author: book.first_name ? {
          name: `${book.first_name} ${book.last_name}`
        } : null
      })),
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;