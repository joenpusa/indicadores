const express = require('express');
const router = express.Router();
const SecretariasController = require('../controllers/secretariasController');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/adminAuth.middleware');

// Public route
router.get('/', SecretariasController.getAll);

// Protected routes
router.post('/', verifyToken, verifyAdmin, SecretariasController.create);
router.put('/:id', verifyToken, verifyAdmin, SecretariasController.update);
router.delete('/:id', verifyToken, verifyAdmin, SecretariasController.delete);

module.exports = router;
