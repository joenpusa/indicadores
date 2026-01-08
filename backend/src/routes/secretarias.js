const express = require('express');
const router = express.Router();
const SecretariasController = require('../controllers/secretariasController');
const verifyToken = require('../middlewares/auth.middleware');

// Public route
router.get('/', SecretariasController.getAll);

// Protected routes
router.post('/', verifyToken, SecretariasController.create);
router.put('/:id', verifyToken, SecretariasController.update);
router.delete('/:id', verifyToken, SecretariasController.delete);

module.exports = router;
