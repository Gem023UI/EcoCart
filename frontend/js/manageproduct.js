const connection = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/products/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// DONE GET ALL PRODUCTS WITH IMAGES
const getAllProducts = (req, res) => {
    console.log('getAllProducts called'); // Add logging
    
    const query = `
        SELECT 
            p.ProductID AS id,
            p.Name AS name,
            c.Category AS category,
            p.Description AS description,
            p.Price AS price,
            p.Stocks AS stocks,
            GROUP_CONCAT(pi.Image) AS images
        FROM product p
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
        LEFT JOIN productimage pi ON p.ProductID = pi.ProductID
        GROUP BY p.ProductID
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        // Process results to handle images array
        const processedResults = results.map(product => ({
            ...product,
            images: product.images ? product.images.split(',') : []
        }));
        
        console.log('Query results:', processedResults);
        res.json({ products: processedResults });
    });
};

// DONE GET PRODUCT BY ID
const getProductById = (req, res) => {
    const productId = req.params.id;
    console.log('getProductById called for ID:', productId);
    
    const query = `
        SELECT 
            p.ProductID,
            p.Name,
            p.Description,
            p.Price,
            p.Stocks,
            p.ProdCategoryID,
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

// DONE GET PRODUCT IMAGES BY PRODUCT ID
const getProductImages = (req, res) => {
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

// UPDATE PRODUCT BY ID
const updateProductById = (req, res) => {
    const { id } = req.params;
    const { name, description, price, stocks, categoryId } = req.body;
    
    console.log(`Updating product ${id} with data:`, req.body);
    
    const sql = 'UPDATE product SET Name = ?, Description = ?, Price = ?, Stocks = ?, ProdCategoryID = ? WHERE ProductID = ?';
    
    connection.query(sql, [name, description, price, stocks, categoryId, id], (err, result) => {
        if (err) {
            console.error('Database error in updateProductById:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ success: true, message: 'Product updated successfully' });
    });
};

// DELETE PRODUCT BY ID
const deleteProductById = (req, res) => {
    const { id } = req.params;
    console.log(`Deleting product with ID: ${id}`);
    
    connection.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: 'Transaction error', details: err.message });
        }
        
        // First, get all images for this product
        const getImagesQuery = 'SELECT Image FROM productimage WHERE ProductID = ?';
        connection.query(getImagesQuery, [id], (err, images) => {
            if (err) {
                return connection.rollback(() => {
                    console.error('Error getting images:', err);
                    res.status(500).json({ error: 'Database error', details: err.message });
                });
            }
            
            // Delete images from productimage table
            const deleteImagesQuery = 'DELETE FROM productimage WHERE ProductID = ?';
            connection.query(deleteImagesQuery, [id], (err) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Error deleting images from database:', err);
                        res.status(500).json({ error: 'Database error', details: err.message });
                    });
                }
                
                // Delete the product
                const deleteProductQuery = 'DELETE FROM product WHERE ProductID = ?';
                connection.query(deleteProductQuery, [id], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Error deleting product:', err);
                            res.status(500).json({ error: 'Database error', details: err.message });
                        });
                    }
                    
                    if (result.affectedRows === 0) {
                        return connection.rollback(() => {
                            res.status(404).json({ error: 'Product not found' });
                        });
                    }
                    
                    // Commit the transaction
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error('Commit error:', err);
                                res.status(500).json({ error: 'Transaction error', details: err.message });
                            });
                        }
                        
                        // Delete image files from filesystem
                        images.forEach(image => {
                            const imagePath = path.join(__dirname, '..', 'uploads', 'products', image.Image);
                            fs.unlink(imagePath, (err) => {
                                if (err) {
                                    console.error('Error deleting image file:', err);
                                }
                            });
                        });
                        
                        res.json({ success: true, message: 'Product deleted successfully' });
                    });
                });
            });
        });
    });
};

// UPLOAD PRODUCT IMAGES
const uploadProductImages = (req, res) => {
    const productId = req.params.id;
    const files = req.files;
    
    console.log(`Uploading images for product ${productId}:`, files);
    
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Insert image records into database
    const values = files.map(file => [productId, file.filename]);
    const sql = 'INSERT INTO productimage (ProductID, Image) VALUES ?';
    
    connection.query(sql, [values], (err, result) => {
        if (err) {
            console.error('Database error in uploadProductImages:', err);
            // Clean up uploaded files if database insert fails
            files.forEach(file => {
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            });
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json({ 
            success: true, 
            message: 'Images uploaded successfully',
            uploadedCount: files.length
        });
    });
};

// DELETE PRODUCT IMAGE
const deleteProductImage = (req, res) => {
    const { imageId } = req.params;
    console.log(`Deleting image with ID: ${imageId}`);
    
    // First get the image filename
    const getImageQuery = 'SELECT Image FROM productimage WHERE ProductImageID = ?';
    connection.query(getImageQuery, [imageId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        
        const imageName = results[0].Image;
        
        // Delete from database
        const deleteQuery = 'DELETE FROM productimage WHERE ProductImageID = ?';
        connection.query(deleteQuery, [imageId], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            
            // Delete file from filesystem
            const imagePath = path.join(__dirname, '..', 'uploads', 'products', imageName);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image file:', err);
                }
            });
            
            res.json({ success: true, message: 'Image deleted successfully' });
        });
    });
};

// GET ALL CATEGORIES
const getAllCategories = (req, res) => {
    const sql = 'SELECT * FROM category';
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Database error in getAllCategories:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json(results);
    });
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductImages,
    updateProductById,
    deleteProductById,
    uploadProductImages,
    deleteProductImage,
    getAllCategories,
    uploadProductImages
};