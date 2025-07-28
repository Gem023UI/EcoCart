const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
} = require('../controllers/manageuser');

console.log('User routes being registered...');

// User Management Routes
router.get('/userTable', getAllUsers);
router.get('/userEdit/:id', getUserById);
router.put('/userUpdate/:id', updateUserById);
router.delete('/userDelete/:id', deleteUserById);

console.log('User routes registered successfully');

module.exports = router;