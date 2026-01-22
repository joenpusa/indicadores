const IndicadoresModel = require('../models/indicadoresModel');
const VariablesModel = require('../models/variablesModel');
const GraficosModel = require('../models/graficosModel');
const RegistrosModel = require('../models/registrosModel');
const PeriodosModel = require('../models/periodosModel');

const RegistrosDAO = require('../daos/registrosDao');
const ValoresDAO = require('../daos/valoresDao');
const xlsx = require('xlsx');

class IndicadoresController {
    // --- Data Loading ---

    // Download Excel Template
    static async descargarPlantilla(req, res) {
        try {
            const { id } = req.params;
            const variables = await VariablesModel.getVariablesByIndicador(id);
            const indicador = await IndicadoresModel.getIndicadorById(id);

            if (!indicador) return res.status(404).json({ message: 'Indicador no encontrado' });

            // Define headers
            const headers = ['Codigo Municipio', 'Periodo', 'Descripcion'];
            variables.forEach(v => headers.push(v.nombre));

            // Create workbook
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.aoa_to_sheet([headers]);

            // Add example row (optional)
            // const example = ['54001', '2024-1', 'Carga inicial', ...variables.map(v => v.tipo === 'numero' ? 100 : 'texto')];
            // xlsx.utils.sheet_add_aoa(ws, [example], { origin: -1 });

            xlsx.utils.book_append_sheet(wb, ws, "Plantilla");

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', `attachment; filename="Plantilla_${indicador.nombre.replace(/\s+/g, '_')}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: true, message: 'Error al generar plantilla' });
        }
    }

    // Upload Data (Manual or File)
    static async cargarDatos(req, res) {
        // If file is present, it's bulk upload
        // If req.body has data, it's manual
        // Note: Manual upload might also use this endpoint via JSON body

        try {
            const { id } = req.params;

            if (req.file) {
                // Bulk Upload Logic
                return IndicadoresController.procesarArchivo(req, res, id);
            } else {
                // Manual Entry Logic
                return IndicadoresController.procesarManual(req, res, id);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async procesarManual(req, res, idIndicador) {
        const { id_municipio, anio, numero, descripcion, valores } = req.body;
        // valores: { id_variable: value, ... } or array of { id_variable, valor }

        if (!id_municipio || !anio) {
            return res.status(400).json({ message: 'Municipio y Año son obligatorios' });
        }

        try {
            // Validation: Allowed Periodicity
            const indicador = await IndicadoresModel.getIndicadorById(idIndicador);

            if (!indicador) {
                return res.status(404).json({ message: 'Indicador no encontrado' });
            }

            // Period validation handled by findOrCreate logic potentially, but we should check if logic matches indicator type.
            // Actually, findOrCreate creates ANY period type requested.
            // We should ensure we are creating the RIGHT type for this indicator.
            const tipo = indicador.periodicidad;
            if (!tipo) return res.status(400).json({ message: 'Indicador sin periodicidad definida' });

            // Sub-period validation
            if (tipo !== 'anual' && !numero) {
                return res.status(400).json({ message: `Para periodicidad ${tipo} se requiere especificar el periodo (número)` });
            }

            // Find or Create Period
            const idPeriodo = await PeriodosModel.findOrCreate(tipo, anio, numero);

            const idRegistro = await RegistrosDAO.create({
                id_indicador: idIndicador,
                id_municipio,
                id_periodo: idPeriodo,
                descripcion
            });

            // Insert Values
            if (valores && Array.isArray(valores)) {
                const valuesToInsert = valores.map(v => ({
                    id_registro: idRegistro,
                    id_variable: v.id_variable,
                    valor: v.valor
                }));
                await ValoresDAO.createBatch(valuesToInsert);
            }

            res.status(201).json({ message: 'Registro creado exitosamente', id: idRegistro });
        } catch (error) {
            console.error(error);
            // Handle unique constraint error specifically if needed
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Ya existe un registro para este municipio y periodo.' });
            }
            res.status(500).json({ message: 'Error al procesar registro', error: error.message });
        }
    }

    static async procesarArchivo(req, res, idIndicador) {
        try {
            const buffer = req.file.buffer;
            const wb = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            if (data.length === 0) return res.status(400).json({ message: 'El archivo está vacío' });

            const indicador = await IndicadoresModel.getIndicadorById(idIndicador);
            if (!indicador) return res.status(404).json({ message: 'Indicador no encontrado' });

            const variables = await VariablesModel.getVariablesByIndicador(idIndicador);
            const mapMunicipios = await RegistrosDAO.getAllMunicipiosMap();

            const recordsToCreate = [];
            const errors = []; // Array of strings

            const tipoPeriodo = indicador.periodicidad;

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNum = i + 2; // Excel row number (1-based + header)
                const codigoMuni = row['Codigo Municipio'];
                const periodoStr = String(row['Periodo']).trim();

                // 1. Validate Municipio
                const idMunicipio = mapMunicipios.get(String(codigoMuni));
                if (!idMunicipio) {
                    errors.push(`Fila ${rowNum}: Código de municipio '${codigoMuni}' no válido.`);
                    continue; // Skip row
                }

                // 2. Validate/Parse Periodo
                let anio, numero = null;
                let parsed = false;

                try {
                    if (tipoPeriodo === 'anual') {
                        // Format: YYYY (e.g. 2025)
                        if (/^\d{4}$/.test(periodoStr)) {
                            anio = parseInt(periodoStr);
                            parsed = true;
                        }
                    } else if (tipoPeriodo === 'semestral') {
                        // Format: YYYY-S1 or YYYY-S2
                        const match = periodoStr.match(/^(\d{4})-S([1-2])$/i);
                        if (match) {
                            anio = parseInt(match[1]);
                            numero = parseInt(match[2]);
                            parsed = true;
                        }
                    } else if (tipoPeriodo === 'trimestral') {
                        // Format: YYYY-T1 ... YYYY-T4
                        const match = periodoStr.match(/^(\d{4})-T([1-4])$/i);
                        if (match) {
                            anio = parseInt(match[1]);
                            numero = parseInt(match[2]);
                            parsed = true;
                        }
                    } else if (tipoPeriodo === 'mensual') {
                        // Format: YYYY-MM (e.g. 2022-01)
                        const match = periodoStr.match(/^(\d{4})-(\d{1,2})$/);
                        if (match) {
                            anio = parseInt(match[1]);
                            numero = parseInt(match[2]);
                            if (numero >= 1 && numero <= 12) parsed = true;
                        }
                    }
                } catch (e) {
                    // Ignore parse error, handled by !parsed
                }

                if (!parsed) {
                    errors.push(`Fila ${rowNum}: Formato de periodo '${periodoStr}' inválido para periodicidad ${tipoPeriodo}.`);
                    continue;
                }

                // 3. Find or Create Period
                // Could be optimized by caching periods, but findOrCreate logic handles it reasonable well.
                // We await inside loop, simpler logic.
                const idPeriodo = await PeriodosModel.findOrCreate(tipoPeriodo, anio, numero);

                recordsToCreate.push({
                    id_indicador: idIndicador,
                    id_municipio: idMunicipio,
                    id_periodo: idPeriodo,
                    descripcion: row['Descripcion'] || 'Carga Masiva',
                    originalRow: row
                });
            }

            // If ALL failed
            if (recordsToCreate.length === 0 && errors.length > 0) {
                const logContent = errors.join('\n');
                return res.status(400).json({
                    message: 'Todos los registros fallaron.',
                    log: logContent
                });
            }

            // Insert Valid Records
            const createdRecords = await RegistrosDAO.createBatch(recordsToCreate);

            // Prepare Values
            const valuesToCreate = [];
            createdRecords.forEach(rec => {
                variables.forEach(variable => {
                    const val = rec.originalRow[variable.nombre];
                    if (val !== undefined && val !== null && val !== '') {
                        valuesToCreate.push({
                            id_registro: rec.id_registro,
                            id_variable: variable.id_variable,
                            valor: val
                        });
                    }
                });
            });

            await ValoresDAO.createBatch(valuesToCreate);

            if (errors.length > 0) {
                // Partial success
                const logContent = errors.join('\n');
                return res.json({
                    message: `Se cargaron ${createdRecords.length} registros. Fallaron ${errors.length}.`,
                    log: logContent,
                    partial: true
                });
            }

            res.json({ message: `Carga exitosa. ${createdRecords.length} registros creados.` });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error procesando archivo', error: error.message });
        }
    }

    // --- Indicadores ---
    static async listarIndicadores(req, res) {
        try {
            const { q, active, page, limit, id_secretaria } = req.query;
            const result = await IndicadoresModel.getAllIndicadores({ q, active, page, limit, id_secretaria });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async crearIndicador(req, res) {
        try {
            const id = await IndicadoresModel.createIndicador(req.body);
            res.status(201).json({ message: 'Indicador creado', id });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    static async actualizarIndicador(req, res) {
        try {
            const { id } = req.params;
            await IndicadoresModel.updateIndicador(id, req.body);
            res.json({ message: 'Indicador actualizado' });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    static async obtenerIndicador(req, res) {
        try {
            const { id } = req.params;
            const indicador = await IndicadoresModel.getIndicadorById(id);
            if (!indicador) return res.status(404).json({ error: true, message: 'Indicador no encontrado' });
            res.json(indicador);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    // --- Variables ---
    static async listarVariables(req, res) {
        try {
            const { id } = req.params;
            const variables = await VariablesModel.getVariablesByIndicador(id);
            res.json(variables);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async crearVariable(req, res) {
        try {
            const { id } = req.params; // id_indicador
            const variableId = await VariablesModel.createVariable({ ...req.body, id_indicador: id });
            res.status(201).json({ message: 'Variable creada', id: variableId });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    static async actualizarVariable(req, res) {
        try {
            // Route: /variables/:id ? Or /indicadores/:idIndicador/variables/:idVariable
            // Usually update needs generic ID.
            // If route is /api/indicadores/variables/:id
            const { id } = req.params;
            await VariablesModel.updateVariable(id, req.body);
            res.json({ message: 'Variable actualizada' });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    static async eliminarVariable(req, res) {
        try {
            const { id } = req.params;
            await VariablesModel.deleteVariable(id);
            res.json({ message: 'Variable eliminada' });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    // --- Configuración Visualización ---
    static async obtenerConfiguracion(req, res) {
        try {
            const { id } = req.params; // id_indicador
            const config = await GraficosModel.getConfigByIndicador(id);
            res.json(config || {}); // Return empty obj if not found
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async guardarConfiguracion(req, res) {
        try {
            const { id } = req.params; // id_indicador
            await GraficosModel.updateConfigByIndicador(id, req.body);
            res.json({ message: 'Configuración guardada' });
        } catch (error) {
            res.status(400).json({ error: true, message: error.message });
        }
    }

    // --- Registros / Carga de Datos ---


    static async obtenerDatos(req, res) {
        try {
            const { id } = req.params; // id_indicador
            const { id_periodo } = req.query; // Filter by period optional now

            const registros = await RegistrosModel.getRegistros(id, id_periodo);
            res.json(registros);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async eliminarRegistro(req, res) {
        try {
            const { idRegistro } = req.params;
            const deleted = await RegistrosDAO.delete(idRegistro);
            if (deleted === 0) return res.status(404).json({ message: 'Registro no encontrado' });
            res.json({ message: 'Registro eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: true, message: 'Error al eliminar registro' });
        }
    }

    // --- Periodos ---
    static async listarPeriodos(req, res) {
        try {
            const periodos = await PeriodosModel.getAllPeriodos();
            res.json(periodos);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async listarPeriodosIndicador(req, res) {
        try {
            const { id } = req.params;
            const periodos = await RegistrosDAO.getAvailablePeriods(id);
            res.json(periodos);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    // --- Dashboard ---
    static async obtenerDatosDashboard(req, res) {
        try {
            const { id } = req.params; // id_indicador
            const { id_periodo, active, id_municipio, id_variable } = req.query; // Filters

            // 1. Validate Indicator
            const indicador = await IndicadoresModel.getIndicadorById(id);
            if (!indicador) return res.status(404).json({ message: 'Indicador no encontrado' });

            // 2. Register filters
            // We need a DAO method that supports aggregation.
            // For now, let's implement the logic here calling Model/DAO methods we'll creating.
            const dashboardData = await IndicadoresModel.getDashboardData(id, { id_periodo, active, id_municipio, id_variable });

            res.json(dashboardData);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = IndicadoresController;
