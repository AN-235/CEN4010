const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// CREATE CREDIT CARD
router.post('/create/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const { cardNumber, expiration, cvv } = req.body;

        // Validate required fields
        if (!cardNumber || !expiration || !cvv) {
            return res.status(400).json({ error: "Missing credit card fields" });
        }

        // CHECK IF USER EXISTS 
        const [userRows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ error: "Incorrect username" });
        }

        // INSERT CREDIT CARD 
        const sql = `
            INSERT INTO credit_cards (username, card_number, expiration, cvv)
            VALUES (?, ?, ?, ?)
        `;

        await pool.query(sql, [username, cardNumber, expiration, cvv]);

        // SUCCESS RESPONSE
        res.status(201).json({
            status: "success",
            message: "Credit card created"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
