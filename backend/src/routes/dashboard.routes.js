const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/metrics', verifyToken, dashboardController.getDashboardMetrics);

module.exports = router;
