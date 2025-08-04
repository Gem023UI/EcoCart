const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');

router.get('/dashboard/overview', dashboardController.getOverview);

module.exports = router;
