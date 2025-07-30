const connection = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.getAllProducts = (req, res) => {
    // First get all products
    const productSql = `
        SELECT 
            p.*,
            c.Category
        FROM product p 
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
        ORDER BY p.ProductID DESC
    `;
    
    try {
        connection.query(productSql, (err, products, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return res.status(500).json({ error: 'Database error', details: err });
            }

            if (products.length === 0) {
                return res.status(200).json({ rows: [] });
            }

            // Get all images for all products
            const productIds = products.map(p => p.ProductID);
            const imagesSql = `
                SELECT ProductID, ProductImageID, Image 
                FROM productimage 
                WHERE ProductID IN (${productIds.map(() => '?').join(',')})
            `;

            connection.query(imagesSql, productIds, (err, images) => {
                if (err instanceof Error) {
                    console.log(err);
                    return res.status(500).json({ error: 'Database error', details: err });
                }

                // Group images by ProductID
                const imagesByProduct = {};
                images.forEach(image => {
                    if (!imagesByProduct[image.ProductID]) {
                        imagesByProduct[image.ProductID] = [];
                    }
                    imagesByProduct[image.ProductID].push({
                        ProductImageID: image.ProductImageID,
                        Image: image.Image
                    });
                });

                // Combine products with their images
                const processedRows = products.map(product => ({
                    ...product,
                    images: imagesByProduct[product.ProductID] || []
                }));

                return res.status(200).json({
                    rows: processedRows,
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

exports.getSingleProduct = (req, res) => {
    const productId = parseInt(req.params.id);
    
    // First get the product
    const productSql = `
        SELECT 
            p.*,
            c.Category
        FROM product p 
        LEFT JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
        WHERE p.ProductID = ?
    `;
    
    try {
        connection.execute(productSql, [productId], (err, products, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return res.status(500).json({ error: 'Database error', details: err });
            }

            if (products.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get images for this product
            const imagesSql = `
                SELECT ProductImageID, Image 
                FROM productimage 
                WHERE ProductID = ?
            `;

            connection.execute(imagesSql, [productId], (err, images) => {
                if (err instanceof Error) {
                    console.log(err);
                    return res.status(500).json({ error: 'Database error', details: err });
                }

                const product = products[0];
                product.images = images.map(image => ({
                    ProductImageID: image.ProductImageID,
                    Image: image.Image
                }));

                return res.status(200).json({
                    success: true,
                    result: [product]
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

exports.createProduct = (req, res) => {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Check if req.body exists
    if (!req.body) {
        return res.status(400).json({ error: 'Request body is missing. Check your middleware configuration.' });
    }

    const { name, description, price, stocks, category } = req.body;
    const images = req.files || [];

    if (!name || !description || !price || !stocks || !category) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, description, price, stocks, category',
            received: req.body
        });
    }

    // Validate price and stocks are numbers
    if (isNaN(price) || isNaN(stocks)) {
        return res.status(400).json({ error: 'Price and stocks must be valid numbers' });
    }

    const sql = 'INSERT INTO product (ProdCategoryID, Name, Description, Price, Stocks) VALUES (?, ?, ?, ?, ?)';
    const values = [parseInt(category), name, description, parseFloat(price), parseInt(stocks)];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error inserting product', details: err });
        }

        const productId = result.insertId;
        console.log('Product ID:', productId);

        // If there are images, insert them into productimage table
        if (images.length > 0) {
            const imagePromises = images.map(image => {
                return new Promise((resolve, reject) => {
                    // Ensure we're using the original filename
                    const originalFilename = image.originalname || image.filename;
                    const relativePath = `assets/products/${originalFilename}`;
                    const imageSql = 'INSERT INTO productimage (ProductID, Image) VALUES (?, ?)';
                    const imageValues = [productId, relativePath];
                    
                    connection.execute(imageSql, imageValues, (err, result) => {
                        if (err) {
                            console.log('Error inserting image:', err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });

            Promise.all(imagePromises)
                .then(results => {
                    return res.status(201).json({
                        success: true,
                        productId: productId,
                        message: 'Product created successfully with images',
                        imagesUploaded: images.length
                    });
                })
                .catch(error => {
                    console.log('Error uploading images:', error);
                    return res.status(500).json({ 
                        error: 'Product created but failed to upload some images', 
                        details: error,
                        productId: productId
                    });
                });
        } else {
            return res.status(201).json({
                success: true,
                productId: productId,
                message: 'Product created successfully without images'
            });
        }
    });
};

exports.updateProduct = (req, res) => {
    console.log('Update request body:', req.body);
    console.log('Update files:', req.files);

    const id = parseInt(req.params.id);
    const { name, description, price, stocks, category } = req.body;
    const images = req.files || [];

    if (!name || !description || !price || !stocks || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (isNaN(price) || isNaN(stocks)) {
        return res.status(400).json({ error: 'Price and stocks must be valid numbers' });
    }

    const sql = `
        UPDATE product 
        SET ProdCategoryID = ?, Name = ?, Description = ?, Price = ?, Stocks = ? 
        WHERE ProductID = ?
    `;
    const values = [parseInt(category), name, description, parseFloat(price), parseInt(stocks), id];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error updating product', details: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (images.length > 0) {
            const insertPromises = images.map(image => {
                return new Promise((resolve, reject) => {
                    const relativePath = `assets/products/${image.originalname}`;

                    const insertSql = `
                        INSERT INTO productimage (ProductID, Image) 
                        VALUES (?, ?)
                    `;
                    connection.execute(insertSql, [id, relativePath], (err, result) => {
                        if (err) {
                            console.log('Error inserting image:', err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });

            Promise.all(insertPromises)
                .then(() => {
                    return res.status(200).json({
                        success: true,
                        message: 'Product updated successfully with new images',
                        imagesAdded: images.length
                    });
                })
                .catch(err => {
                    console.error(err);
                    return res.status(500).json({
                        error: 'Product updated but failed to insert some images',
                        details: err
                    });
                });

        } else {
            return res.status(200).json({
                success: true,
                message: 'Product updated successfully (no new images)'
            });
        }
    });
};

exports.deleteProduct = (req, res) => {
    const id = req.params.id;
    
    // First, get all images for this product to delete files from filesystem
    const getImagesSql = 'SELECT Image FROM productimage WHERE ProductID = ?';
    
    connection.execute(getImagesSql, [parseInt(id)], (err, images) => {
        if (err) {
            console.log('Error getting images for deletion:', err);
            return res.status(500).json({ error: 'Error retrieving product images', details: err });
        }

        // Delete image files from filesystem
        const deleteFilePromises = images.map(image => {
            return new Promise((resolve) => {
                // Convert relative path to absolute path
                const imagePath = path.join(__dirname, '../EcoCart/frontend/assets/products', path.basename(image.Image));
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.log('Error deleting image file:', err);
                    }
                    resolve(); // Always resolve to continue with database deletion
                });
            });
        });

        Promise.all(deleteFilePromises).then(() => {
            // Delete from productimage table first (foreign key constraint)
            const deleteImagesSql = 'DELETE FROM productimage WHERE ProductID = ?';
            
            connection.execute(deleteImagesSql, [parseInt(id)], (err, result) => {
                if (err) {
                    console.log('Error deleting product images:', err);
                    return res.status(500).json({ error: 'Error deleting product images', details: err });
                }

                // Then delete from product table
                const deleteProductSql = 'DELETE FROM product WHERE ProductID = ?';
                
                connection.execute(deleteProductSql, [parseInt(id)], (err, result) => {
                    if (err) {
                        console.log('Error deleting product:', err);
                        return res.status(500).json({ error: 'Error deleting product', details: err });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'Product not found' });
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Product and all associated images deleted successfully'
                    });
                });
            });
        });
    });
};

exports.deleteProductImage = (req, res) => {
    const imageId = req.params.imageId;
    
    // First, get the image path to delete the file
    const getImageSql = 'SELECT Image FROM productimage WHERE ProductImageID = ?';
    
    connection.execute(getImageSql, [parseInt(imageId)], (err, result) => {
        if (err) {
            console.log('Error getting image:', err);
            return res.status(500).json({ error: 'Error retrieving image', details: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Convert relative path to absolute path
        const imagePath = path.join(__dirname, '../EcoCart/frontend/assets/products', path.basename(result[0].Image));
        
        // Delete the physical file
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.log('Error deleting image file:', err);
            }
            
            // Delete from database regardless of file deletion success
            const deleteSql = 'DELETE FROM productimage WHERE ProductImageID = ?';
            
            connection.execute(deleteSql, [parseInt(imageId)], (err, result) => {
                if (err) {
                    console.log('Error deleting image from database:', err);
                    return res.status(500).json({ error: 'Error deleting image from database', details: err });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Image deleted successfully'
                });
            });
        });
    });
};