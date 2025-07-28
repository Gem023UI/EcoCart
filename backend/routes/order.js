const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');

// Create a new order
router.post('/create-order', orderController.createOrder);

// Get order history for a user
router.get('/history/:userId', orderController.getOrderHistory);

// Get detailed order information
router.get('/details/:orderLineId', orderController.getOrderDetails);

module.exports = router;