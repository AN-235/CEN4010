const express = require('express');
const router = express.Router();
const pool = require('../db/database');

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

// GET USER BY USERNAME (Retrieve package, no DAO file)
router.get('/get/:username', async (req, res) => {
    try {
        const username = req.params.username;

        const sql = "SELECT * FROM users WHERE username = ?";
        const [rows] = await pool.query(sql, [username]);

        if (rows.length === 0) {
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

// UPDATE USER (Update package, no DAO file)
router.put('/update/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const { field, value } = req.body;

        // Validate method (Express already ensures PUT, but we keep logic consistent)
        if (!field || !value) {
            return res.status(400).json({ error: "Missing field or value" });
        }

        // Block email updates (same as Java)
        if (field.toLowerCase() === "email") {
            return res.status(400).json({ error: "Email cannot be updated." });
        }

        // Map Java field names to SQL column names
        let column;
        switch (field) {
            case "password": column = "password"; break;
            case "name": column = "name"; break;
            case "homeAddress": column = "home_address"; break;
            default:
                return res.status(400).json({ error: "Invalid field: " + field });
        }

        // Build SQL
        const sql = `UPDATE users SET ${column} = ? WHERE username = ?`;

        // Execute update
        const [result] = await pool.query(sql, [value, username]);

        // If no user found
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // SUCCESS RESPONSE
        res.json({
            status: "success",
            message: "User updated"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
