const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
} = require('../controllers/manageuser');
const { verifyAdmin } = require('../middleware/auth');


console.log('User routes being registered...');

// User Management Routes
router.get('/userTable', verifyAdmin, getAllUsers);
router.get('/userEdit/:id', verifyAdmin, getUserById);
router.put('/userUpdate/:id', verifyAdmin, updateUserById);
router.delete('/userDelete/:id', verifyAdmin, deleteUserById);

console.log('User routes registered successfully');

module.exports = router;