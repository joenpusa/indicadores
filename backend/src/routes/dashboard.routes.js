const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/metrics', verifyToken, dashboardController.getDashboardMetrics);
router.get('/public-metrics', dashboardController.getPublicMetrics);

module.exports = router;
