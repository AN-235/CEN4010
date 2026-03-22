//Shopping cart feature

const express = require('express');
const router = express.Router();
const db= require('../utils/database');

// RETRIEVING ITERMS FROM CART

router.get('/:userId', async (req, res) =>
{
    const { userId } = req.params;
           try {
               const [rows] = await db.query(`
               SELECT b.id AS bookId, b.title, b.price, c.quantity
               FROM cart_items c
                JOIN books b ON c.book_id = b.id
                WHERE c.user_id = ?
                `, [userId]);
                res.json(rows);
               }
               catch (err)
               {
               res.status(500).json({error: err.message})
               }
               });


// GETTING SUBTOTAL
router.get('/:userId/subtotal', async(req,res) =>
{
const{userId} = req.params;

try
{
const[rows] = await db.query(`
                SELECT SUM(b.price * c.quantity) AS subtotal
                FROM cart_items c
                JOIN books b ON c.book_id = b.id
                WHERE c.user_id = ?
                `, [userId]);

               res.json({subtotal: rows[0].subtotal || 0});
}
catch (err)
{
    res.status(500).json({error: err.message});
}
});

// ADDING TO CART
router.post('/',async(req,res) =>
{
    const{userId, bookId, quantity} = req.body
    try {
            const [existing] = await db.query
            (
                'SELECT * FROM cart_items WHERE user_id = ? AND book_id = ?',
                [userId, bookId]
            );

            if (existing.length > 0)
            {
                await db.query(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND book_id = ?',
                    [quantity, userId, bookId]
                );
            }
            else
            {
                await db.query(
                    'INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)',
                    [userId, bookId, quantity]
                );
            }
    res.json({message: "Added to cart"});
    }
    catch(err)
    {
    res.status(500).json({error: err.message});
    }
});

//DELETE FROM CART

router.delete('/:userId/book/:bookId', async (req, res) => {
    const {userId, bookId} = req.params;

    try
    {
    await db.query(
     'DELETE FROM cart_items WHERE user_id = ? AND book_id = ?',
                [userId, bookId]
    );
    res.json({ message: 'Item removed from cart' });
                }
                catch (err)
                {
                    res.status(500).json({ error: err.message });
                }
            });
module.exports = router;
