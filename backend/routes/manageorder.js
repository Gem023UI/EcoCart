const express = require('express');
const router = express.Router();
const orderController = require('../controllers/manageorder');
const { verifyAdmin } = require('../middleware/auth');

router.get('/renderOrders/', verifyAdmin, orderController.getAllOrders);
router.get('/renderOrderID/:id', verifyAdmin, orderController.getOrderById);
router.put('/updateOrderID/:id/status', verifyAdmin, orderController.updateOrderStatus);
router.delete('/deleteOrderID/:id', verifyAdmin, orderController.deleteOrder);

module.exports = router;