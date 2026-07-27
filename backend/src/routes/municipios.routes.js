const express = require('express');
const router = express.Router();
const MunicipiosController = require('../controllers/municipiosController');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/adminAuth.middleware');

router.get('/', MunicipiosController.getAll);
router.post('/', verifyToken, verifyAdmin, MunicipiosController.create);
router.put('/:id', verifyToken, verifyAdmin, MunicipiosController.update);

module.exports = router;
