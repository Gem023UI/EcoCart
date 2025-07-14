const jsonwebtoken = require('jsonwebtoken');
const connection = require('../config/database');
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
} = require('../controllers/dashboard');

console.log('Dashboard routes being registered...');

// User management routes
router.get('/userTable', getAllUsers);
router.get('/userEdit/:id', getUserById);
router.put('/userUpdate/:id', updateUserById);
router.delete('/userDelete/:id', deleteUserById);

console.log('Dashboard routes registered successfully');

module.exports = router;