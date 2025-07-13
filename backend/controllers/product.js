const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAllProducts = (req, res) => {
    console.log('getAllProducts called'); // Add logging
    
    const query = `
        SELECT 
            p.ProductID AS id,
            p.Name AS name,
            c.Category AS category,
            p.Description AS description,
            p.Price AS price,
            p.Stocks AS stocks,
            pi.Image AS image
        FROM product p
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
        LEFT JOIN productimage pi ON p.ProductID = pi.ProductID
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        console.log('Query results:', results);
        res.json({ products: results });
    });
};