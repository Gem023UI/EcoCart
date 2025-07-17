const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// Get all products
router.get('/product', productController.getAllProducts);

// Get single product by ID
router.get('/product/:id', productController.getProductById);

// Get product images by product ID
router.get('/product/:id/images', productController.getProductImages);

// Update stock post add to cart
router.patch('/product/:id/update-stock', productController.updateProductStock);

module.exports = router;