const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/usersController');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/adminAuth.middleware');

router.get('/', verifyToken, verifyAdmin, UsersController.getAll);
router.post('/', verifyToken, verifyAdmin, UsersController.create);
router.get('/:id', verifyToken, verifyAdmin, UsersController.getById); // Added getById route
router.put('/:id', verifyToken, verifyAdmin, UsersController.update);
router.delete('/:id', verifyToken, verifyAdmin, UsersController.delete);

module.exports = router;
