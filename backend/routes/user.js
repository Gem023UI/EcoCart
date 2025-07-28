const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    updateUser, 
    deactivateUser 
} = require('../controllers/user');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/update-profile', updateUser);
router.delete('/deactivate', deactivateUser);

module.exports = router;