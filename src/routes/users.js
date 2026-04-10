const express = require('express');
const router = express.Router();
const pool = require('../utils/database');


// CREATE USER
router.post('/', async (req, res) => {
    try {
        const { username, password, name, email, homeAddress } = req.body;

        if (!username) return res.status(400).json({ error: "Username is required" });
        if (!password) return res.status(400).json({ error: "Password is required" });

        const sql = `
            INSERT INTO users (username, password, name, email, home_address)
            VALUES (?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [username, password, name, email, homeAddress]);

        res.status(201).json({ status: "success", message: "User created" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// GET USER BY USERNAME
router.get('/get/:username', async (req, res) => {
    try {
        const username = req.params.username;

        const sql = "SELECT * FROM users WHERE username = ?";
        const rows = await pool.query(sql, [username]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];

        res.json({
            username: user.username,
            password: user.password,
            name: user.name,
            email: user.email,
            homeAddress: user.home_address
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({ error: "Internal server error" });
    }
});


// UPDATE USER
router.put('/update/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const { field, value } = req.body;

        if (!field || !value) {
            return res.status(400).json({ error: "Missing field or value" });
        }

        if (field.toLowerCase() === "email") {
            return res.status(400).json({ error: "Email cannot be updated." });
        }

        let column;
        switch (field) {
            case "password": column = "password"; break;
            case "name": column = "name"; break;
            case "homeAddress": column = "home_address"; break;
            default:
                return res.status(400).json({ error: "Invalid field: " + field });
        }

        const sql = `UPDATE users SET ${column} = ? WHERE username = ?`;
        const result = await pool.query(sql, [value, username]);

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }


        res.json({ status: "success", message: "User updated" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// CREATE CREDIT CARD FOR USER
router.post('/:username/creditcard', async (req, res) => {
    try {
        const username = req.params.username;
        const { cardNumber, expiration, cvv } = req.body;

        if (!cardNumber || !expiration || !cvv) {
            return res.status(400).json({ error: "Missing credit card fields" });
        }

        const [userRows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ error: "Incorrect username" });
        }

        const sql = `
            INSERT INTO credit_cards (username, card_number, expiration, cvv)
            VALUES (?, ?, ?, ?)
        `;

        await pool.query(sql, [username, cardNumber, expiration, cvv]);

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
