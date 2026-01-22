const express = require('express');
const router = express.Router();
const mult = require('multer');
const upload = mult({ storage: mult.memoryStorage() });
const IndicadoresController = require('../controllers/indicadoresController');


// Indicadores
router.get('/', IndicadoresController.listarIndicadores);
router.post('/', IndicadoresController.crearIndicador);
router.get('/:id', IndicadoresController.obtenerIndicador); // New endpoint for editing
router.put('/:id', IndicadoresController.actualizarIndicador);

// Variables
router.get('/:id/variables', IndicadoresController.listarVariables);
router.post('/:id/variables', IndicadoresController.crearVariable);
// Note: Updating/Deleting a specific variable might need a different route structure if ID is variable ID.
// Suggesting /variables/:id for direct updates if needed, but usually nested is mostly for creation/listing.
// Let's add specific variable routes here or separate file?
// Common pattern: /indicadores/:id/variables (list/create)
// And for update/delete specific variable:
router.put('/variables/:id', IndicadoresController.actualizarVariable);
router.delete('/variables/:id', IndicadoresController.eliminarVariable);

// Configuración Visualización
router.get('/:id/visualizacion', IndicadoresController.obtenerConfiguracion);
router.post('/:id/visualizacion', IndicadoresController.guardarConfiguracion); // Or PUT

// Registros / Dashboard
router.get('/:id/plantilla', IndicadoresController.descargarPlantilla);
router.post('/:id/carga', upload.single('archivo'), IndicadoresController.cargarDatos);
router.get('/:id/registros', IndicadoresController.obtenerDatos);
router.delete('/:id/registros/:idRegistro', IndicadoresController.eliminarRegistro);
router.get('/:id/dashboard', IndicadoresController.obtenerDatosDashboard);

// Periodos (Helper for frontend dropdowns)
router.get('/periodos/all', IndicadoresController.listarPeriodos);
router.get('/:id/periodos', IndicadoresController.listarPeriodosIndicador);

module.exports = router;
