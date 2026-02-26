const express = require('express');
const router = express.Router();

// ---------------------------------------------------------
// FEATURE 1: Book Browsing and Sorting\
// Base Route: /api/books (This will be set up in app.js)
// ---------------------------------------------------------

/**
 * 1. Get books by genre
 * Endpoint: GET /api/books/genre/:genre
 */
router.get('/genre/:genre', (req, res) => {
    const genre = req.params.genre;
    
   const sql = `
        SELECT Book_ID, Title, Author, Genre, Price
        FROM BOOKS
        WHERE Genre = ?
    `;

    db.query(sql, [genre], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "No books found for this genre" });
        }


    res.status(200).json(results);
    });
});

/**
 * 2. Get top 10 best-selling books
 * Endpoint: GET /api/books/top-sellers
 */
router.get('/top-sellers', (req, res) => {

    // TODO: Write MySQL query to order books by sales descending, limit 10
    
    res.status(200).json({ 
        message: "This will return the top 10 best-sellers." 
    });
});

/**
 * 3. Get books with a certain rating or higher
 * Endpoint: GET /api/books/rating/:rating
 */
router.get('/rating/:rating', (req, res) => {
    const rating = req.params.rating;

    // TODO: Write MySQL query to find books where rating >= requested rating
    
    res.status(200).json({ 
        message: `This will return books with a rating of ${rating} or higher.` 
    });
});

/**
 * 4. Update the price of books by a publisher (Apply Discount)
 * Endpoint: PUT /api/books/discount
 */
router.put('/discount', (req, res) => {
    // We expect the publisher name and discount amount to be sent in the request body
    const { publisher, discountPercentage } = req.body;

    // TODO: Write MySQL query to update prices for this publisher
    
    res.status(200).json({ 
        message: `This will apply a ${discountPercentage}% discount to books published by ${publisher}.` 
    });
});

// Export the router so it can be used by the main app
module.exports = router;