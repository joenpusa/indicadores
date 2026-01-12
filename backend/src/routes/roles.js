const express = require('express');
const router = express.Router();
const RolesController = require('../controllers/rolesController');
const verifyToken = require('../middlewares/auth.middleware');

// All role endpoints should be protected as per user request
router.get('/', verifyToken, RolesController.getAll);
router.post('/', verifyToken, RolesController.create);
router.put('/:id', verifyToken, RolesController.update);
router.delete('/:id', verifyToken, RolesController.delete);

module.exports = router;
