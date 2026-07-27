const express = require('express');
const router = express.Router();
const RolesController = require('../controllers/rolesController');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/adminAuth.middleware');

// All role endpoints should be protected as per user request
router.get('/', verifyToken, verifyAdmin, RolesController.getAll);
router.post('/', verifyToken, verifyAdmin, RolesController.create);
router.put('/:id', verifyToken, verifyAdmin, RolesController.update);
router.delete('/:id', verifyToken, verifyAdmin, RolesController.delete);

module.exports = router;
