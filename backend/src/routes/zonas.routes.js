const express = require('express');
const router = express.Router();
const ZonasController = require('../controllers/zonasController');

router.get('/', ZonasController.getAll);

module.exports = router;
