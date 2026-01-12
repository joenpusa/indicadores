const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/usersController');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/', verifyToken, UsersController.getAll);
router.post('/', verifyToken, UsersController.create);
router.get('/:id', verifyToken, UsersController.getById); // Added getById route
router.put('/:id', verifyToken, UsersController.update);
router.delete('/:id', verifyToken, UsersController.delete);

module.exports = router;
