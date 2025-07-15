const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getAllProducts,
    getProductById,
    getProductImages,
    updateProductById,
    deleteProductById,
    uploadProductImages,
    deleteProductImage,
    getAllCategories,
    upload
} = require('../controllers/dashboard');

console.log('Dashboard routes being registered...');

// User Management Routes
router.get('/userTable', getAllUsers);
router.get('/userEdit/:id', getUserById);
router.put('/userUpdate/:id', updateUserById);
router.delete('/userDelete/:id', deleteUserById);

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

console.log('Dashboard routes registered successfully');

module.exports = router;