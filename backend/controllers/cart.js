const db = require('../config/database');

// Add to Cart + Reduce Stock
exports.addToCart = (req, res) => {
    const { ProductID, UserID, Quantity } = req.body;
    if (!ProductID || !UserID || !Quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const checkSql = `SELECT * FROM cart WHERE ProductID = ? AND UserID = ?`;
    db.query(checkSql, [ProductID, UserID], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const updateStock = () => {
            const stockSql = `UPDATE product SET Stocks = Stocks - ? WHERE ProductID = ? AND Stocks >= ?`;
            db.query(stockSql, [Quantity, ProductID, Quantity], (err, result) => {
                if (err) return res.status(500).json({ error: 'Failed to update stock' });
                return res.json({ message: 'Added to cart and updated stock' });
            });
        };

        if (results.length > 0) {
            const updateSql = `UPDATE cart SET Quantity = Quantity + ? WHERE ProductID = ? AND UserID = ?`;
            db.query(updateSql, [Quantity, ProductID, UserID], (err, result) => {
                if (err) return res.status(500).json({ error: 'Update cart failed' });
                updateStock();
            });
        } else {
            const insertSql = `INSERT INTO cart (UserID, ProductID, Quantity) VALUES (?, ?, ?)`;
            db.query(insertSql, [UserID, ProductID, Quantity], (err, result) => {
                if (err) return res.status(500).json({ error: 'Insert cart failed' });
                updateStock();
            });
        }
    });
};

exports.getCartItems = (req, res) => {
    const userID = req.params.userID;

    const sql = `
        SELECT 
            c.CartID, c.Quantity, 
            p.ProductID, p.Name, p.Price, p.Stocks, 
            pi.Image
        FROM cart c
        JOIN product p ON c.ProductID = p.ProductID
        LEFT JOIN productimage pi ON p.ProductID = pi.ProductID
        WHERE c.UserID = ?
        GROUP BY c.CartID
    `;

    db.query(sql, [userID], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(results);
    });
};

exports.removeCartItem = (req, res) => {
    const cartID = req.params.cartID;

    const sql = `DELETE FROM cart WHERE CartID = ?`;
    db.query(sql, [cartID], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to remove item' });
        res.json({ message: 'Item removed from cart' });
    });
};
