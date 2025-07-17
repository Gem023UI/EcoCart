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
            (SELECT pi.Image FROM productimage pi WHERE pi.ProductID = p.ProductID LIMIT 1) AS image
        FROM product p
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
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

// Get single product by ID
exports.getProductById = (req, res) => {
    const productId = req.params.id;
    console.log('getProductById called for ID:', productId);
    
    const query = `
        SELECT 
            p.ProductID,
            p.Name,
            p.Description,
            p.Price,
            p.Stocks,
            c.Category AS CategoryName
        FROM product p
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
        WHERE p.ProductID = ?
    `;
    
    connection.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        console.log('Product found:', results[0]);
        res.json(results[0]);
    });
};

// Get product images by product ID
exports.getProductImages = (req, res) => {
    const productId = req.params.id;
    console.log('getProductImages called for product ID:', productId);
    
    const query = `
        SELECT 
            ProductImageID,
            Image
        FROM productimage
        WHERE ProductID = ?
    `;
    
    connection.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        console.log('Images found:', results);
        res.json(results);
    });
};

exports.updateProductStock = (req, res) => {
    const productId = req.params.id;
    const { quantityChange } = req.body;

    const query = `
        UPDATE product 
        SET Stocks = Stocks + ? 
        WHERE ProductID = ?
    `;

    connection.query(query, [quantityChange, productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ success: true });
    });
};