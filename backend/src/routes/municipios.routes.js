const express = require('express');
const router = express.Router();
const MunicipiosController = require('../controllers/municipiosController');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/', MunicipiosController.getAll);
router.post('/', verifyToken, MunicipiosController.create);
router.put('/:id', verifyToken, MunicipiosController.update);

module.exports = router;
