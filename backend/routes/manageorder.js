const express = require('express');
const router = express.Router();
const orderController = require('../controllers/manageorder');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', verifyAdmin, orderController.getAllOrders);
router.get('/:id', verifyAdmin, orderController.getOrderById);
router.put('/:id/status', verifyAdmin, orderController.updateOrderStatus);
router.delete('/:id', verifyAdmin, orderController.deleteOrder);

module.exports = router;