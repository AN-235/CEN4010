const express = require('express');
const router = express.Router();

// ---------------------------------------------------------
// FEATURE 1: Book Browsing and Sorting\
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
 */
router.get('/top-sellers', async (req, res) => {

       try {
        const query = `
            SELECT 
                book_id,
                title,
                author,
                sales_count
            FROM BOOKS
            ORDER BY sales_count DESC
            LIMIT 10;
        `;

        const [rows] = await db.query(query);

        res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: "Server error retrieving top sellers." 
        });
    }
});

/**
 * 3. Get books with a certain rating or higher
 */
router.get('/rating/:rating',async (req, res) => {
    
    const rating = req.params.rating;

   try {
        const query = `
            SELECT 
                book_id,
                title,
                author,
                rating
            FROM books
            WHERE rating >= ?
            ORDER BY rating DESC
        `;

        const [rows] = await db.query(query, [rating]);

        res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});

/**
 * 4. Update the price of books by a publisher 
 */
router.put('/discount', async (req, res) => {

   const { publisher, discountPercentage } = req.body;
   try {
        const query = `
            UPDATE books
            SET price = price * (1 - ? / 100)
            WHERE publisher = ?
        `;

        const [result] = await db.query(query, [discountPercentage, publisher]);

        res.status(200).json({
            message: `Applied a ${discountPercentage}% discount to books published by ${publisher}.`,
            rowsAffected: result.affectedRows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database update failed" });
    }
});


module.exports = router;