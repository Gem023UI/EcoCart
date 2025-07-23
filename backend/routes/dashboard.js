const express = require('express');
const router = express.Router();
const adminController = require('../controllers/dashboard');

router.get('/overview', adminController.getOverview);

module.exports = router;
