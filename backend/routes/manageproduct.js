const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getProductImages,
    updateProductById,
    deleteProductById,
    uploadProductImages,
    deleteProductImage,
    getAllCategories,
    upload
} = require('../controllers/manageproduct');

console.log('Product routes being registered...');

// Product Management Routes
router.get('/productTable', getAllProducts);
router.get('/productEdit/:id', getProductById);
router.get('/productImages/:id', getProductImages);
router.put('/productUpdate/:id', updateProductById);
router.delete('/productDelete/:id', deleteProductById);

// Image Management Routes
router.post('/productImages/:id', upload.array('images', 10), uploadProductImages);
router.delete('/productImage/:imageId', deleteProductImage);

// Category Routes
router.get('/categories', getAllCategories);

console.log('Product routes registered successfully');

module.exports = router;