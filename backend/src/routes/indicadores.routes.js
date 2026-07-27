const express = require('express');
const router = express.Router();
const mult = require('multer');
const upload = mult({ storage: mult.memoryStorage() });
const IndicadoresController = require('../controllers/indicadoresController');
const verifyToken = require('../middlewares/auth.middleware');
const optionalVerifyToken = require('../middlewares/optionalAuth.middleware');


// Indicadores
router.get('/', optionalVerifyToken, IndicadoresController.listarIndicadores);
router.post('/', verifyToken, IndicadoresController.crearIndicador);
router.get('/:id', optionalVerifyToken, IndicadoresController.obtenerIndicador); // New endpoint for editing
router.put('/:id', verifyToken, IndicadoresController.actualizarIndicador);

// Variables
router.get('/:id/variables', optionalVerifyToken, IndicadoresController.listarVariables);
router.post('/:id/variables', verifyToken, IndicadoresController.crearVariable);
router.put('/:id/variables/reorder', verifyToken, IndicadoresController.reordenarVariables);

router.put('/variables/:id', verifyToken, IndicadoresController.actualizarVariable);
router.delete('/variables/:id', verifyToken, IndicadoresController.eliminarVariable);

// Configuración Visualización
router.get('/:id/visualizacion', optionalVerifyToken, IndicadoresController.obtenerConfiguracion);
router.post('/:id/visualizacion', verifyToken, IndicadoresController.guardarConfiguracion); // Or PUT

// Registros / Dashboard
router.get('/:id/plantilla', optionalVerifyToken, IndicadoresController.descargarPlantilla);
router.post('/:id/carga', verifyToken, upload.single('archivo'), IndicadoresController.cargarDatos);
router.get('/:id/registros', optionalVerifyToken, IndicadoresController.obtenerDatos);
router.delete('/:id/registros/all', verifyToken, IndicadoresController.eliminarTodosRegistros);
router.delete('/:id/registros/:idRegistro', verifyToken, IndicadoresController.eliminarRegistro);
router.get('/:id/dashboard', optionalVerifyToken, IndicadoresController.obtenerDatosDashboard);

// Periodos (Helper for frontend dropdowns)
router.get('/periodos/all', optionalVerifyToken, IndicadoresController.listarPeriodos);
router.get('/:id/periodos', optionalVerifyToken, IndicadoresController.listarPeriodosIndicador);

module.exports = router;
