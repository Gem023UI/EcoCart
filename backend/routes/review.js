const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');

router.post('/createReview/', reviewController.createReview);
router.get('/viewReview/product/:productId', reviewController.getReviewsByProduct);

module.exports = router;