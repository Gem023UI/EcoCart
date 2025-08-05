const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile,
    updateUser, 
    deactivateUser 
} = require('../controllers/user');

const { verifyCustomer } = require('../middleware/auth'); // ✅ Use this middleware

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/user-profile', verifyCustomer, getUserProfile); // New route to get profile
router.post('/update-profile', verifyCustomer, updateUser);
router.delete('/deactivate', verifyCustomer, deactivateUser);

module.exports = router;