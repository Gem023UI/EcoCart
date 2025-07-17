const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');

router.post('/add', cartController.addToCart);
router.get('/:userID', cartController.getCartItems);
router.delete('/remove/:cartID', cartController.removeCartItem);


module.exports = router;
