// routes/orderhistory.js
const express = require('express');
const router = express.Router();
const orderHistoryController = require('../controllers/orderhistory');

// GET /api/orderhistory/:userId
router.get('/viewOrderHistory/:userId', orderHistoryController.getOrderHistoryByUser);

module.exports = router;
