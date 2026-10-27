const pool = require('../config/db');

class IndicadoresDAO {
    static async getAll(filters = {}) {
        let sql = `
            SELECT i.*, s.nombre as nombre_secretaria 
            FROM indicadores i
            JOIN secretarias s ON i.id_secretaria = s.id_secretaria
        `;
        let countSql = 'SELECT COUNT(*) as total FROM indicadores i';

        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('(i.nombre LIKE ? OR s.nombre LIKE ?)');
            params.push(`%${filters.q}%`);
            params.push(`%${filters.q}%`);
        }

        if (filters.active !== undefined && filters.active !== null) {
            whereClauses.push('i.es_activo = ?');
            params.push(filters.active);
        }

        if (filters.id_secretaria) {
            whereClauses.push('i.id_secretaria = ?');
            params.push(filters.id_secretaria);
        }

        if (filters.tipo_indicador) {
            whereClauses.push('LOWER(i.tipo_indicador) = LOWER(?)');
            params.push(filters.tipo_indicador);
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            if (filters.q) {
                countSql = `
                    SELECT COUNT(*) as total 
                    FROM indicadores i
                    JOIN secretarias s ON i.id_secretaria = s.id_secretaria
                 ` + whereClause;
            } else {
                countSql += whereClause;
            }
        }

        sql += ' ORDER BY i.created_at DESC';

        if (filters.limit && filters.page) {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        const countParams = params.slice(0, params.length - (filters.limit && filters.page ? 2 : 0));

        const [rows] = await pool.query(sql, params);
        const [countResult] = await pool.query(countSql, countParams);

        const total = countResult[0].total;

        return {
            data: rows,
            meta: {
                total,
                page: parseInt(filters.page) || 1,
                limit: parseInt(filters.limit) || 20,
                totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
            }
        };
    }

    static async create(data) {
        const { id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad, tipo_indicador, fuente_datos } = data;
        const [result] = await pool.query(
            'INSERT INTO indicadores (id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad, tipo_indicador, fuente_datos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad, tipo_indicador, fuente_datos || 'agrupada']
        );
        return result.insertId;
    }

    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
        if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
        if (data.unidad_base !== undefined) { fields.push('unidad_base = ?'); params.push(data.unidad_base); }
        if (data.es_activo !== undefined) { fields.push('es_activo = ?'); params.push(data.es_activo); }
        if (data.id_secretaria !== undefined) { fields.push('id_secretaria = ?'); params.push(data.id_secretaria); }
        if (data.periodicidad !== undefined) { fields.push('periodicidad = ?'); params.push(data.periodicidad); }
        if (data.tipo_indicador !== undefined) { fields.push('tipo_indicador = ?'); params.push(data.tipo_indicador); }
        if (data.fuente_datos !== undefined) { fields.push('fuente_datos = ?'); params.push(data.fuente_datos); }

        if (fields.length === 0) return false;

        params.push(id);

        await pool.query(`UPDATE indicadores SET ${fields.join(', ')} WHERE id_indicador = ?`, params);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT i.*, s.nombre as nombre_secretaria
            FROM indicadores i
            LEFT JOIN secretarias s ON i.id_secretaria = s.id_secretaria
            WHERE i.id_indicador = ?
        `, [id]);

        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    }

    static async delete(id) {
        await pool.query('DELETE FROM indicadores WHERE id_indicador = ?', [id]);
        return true;
    }

    static async deleteCompleto(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Delete valores (via registros)
            await connection.query('DELETE v FROM indicador_valores v JOIN indicador_registros r ON v.id_registro = r.id_registro WHERE r.id_indicador = ?', [id]);
            
            // 2. Delete registros
            await connection.query('DELETE FROM indicador_registros WHERE id_indicador = ?', [id]);

            // 3. Delete graficos config
            await connection.query('DELETE FROM indicador_graficos WHERE id_indicador = ?', [id]);

            // 4. Delete variables
            await connection.query('DELETE FROM indicador_variables WHERE id_indicador = ?', [id]);

            // 5. Delete indicator
            await connection.query('DELETE FROM indicadores WHERE id_indicador = ?', [id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getDashboardData(idIndicador, filters = {}) {
        let { 
            id_periodo, 
            active, 
            id_municipio, 
            id_variable, 
            dimension_valor, 
            agrupar_municipios = 'true', 
            agrupar_periodos = 'ninguno', 
            agrupar_variables = 'true' 
        } = filters;

        // Parse boolean and enum flags
        const agruparMunicipios = agrupar_municipios === true || agrupar_municipios === 'true' || agrupar_municipios === '1' || agrupar_municipios === 1;
        const agruparVariables = agrupar_variables === true || agrupar_variables === 'true' || agrupar_variables === '1' || agrupar_variables === 1;
        const modoPeriodo = (agrupar_periodos === 'anio' || agrupar_periodos === 'todos') ? agrupar_periodos : 'ninguno';

        // 0. Fetch indicator info
        const [indRows] = await pool.query('SELECT fuente_datos, nombre, periodicidad FROM indicadores WHERE id_indicador = ?', [idIndicador]);
        if (indRows.length === 0) throw new Error('Indicador no encontrado');
        const indicadorInfo = indRows[0];
        const fuente_datos = indicadorInfo.fuente_datos || 'agrupada';

        // 1. Fetch all variables of this indicator
        const [allVariables] = await pool.query('SELECT * FROM indicador_variables WHERE id_indicador = ? ORDER BY orden ASC', [idIndicador]);
        const numVars = allVariables.filter(v => v.tipo === 'numero');
        const textDims = allVariables.filter(v => v.tipo === 'texto' && v.es_dimension === 1);

        // 2. Fetch distinct dimension values for slicer/filter (if any text dimensions exist)
        let dimensionOptions = [];
        if (textDims.length > 0) {
            try {
                const [dimRows] = await pool.query(`
                    SELECT DISTINCT iv.id_variable, iv.nombre as dimension_nombre, v.valor, iv.orden
                    FROM indicador_valores v
                    JOIN indicador_variables iv ON v.id_variable = iv.id_variable
                    JOIN indicador_registros r ON v.id_registro = r.id_registro
                    WHERE r.id_indicador = ? AND iv.tipo = 'texto'
                    ORDER BY iv.orden ASC, v.valor ASC
                `, [idIndicador]);
                dimensionOptions = dimRows;
            } catch (e) {
                console.error('Error fetching dimension options:', e);
            }
        }

        // 3. Normalizing Filter Lists
        const parseListParam = (param) => {
            if (!param) return [];
            if (Array.isArray(param)) return param.map(String).map(s => s.trim()).filter(Boolean);
            return String(param).split(',').map(s => s.trim()).filter(s => s && s !== 'all' && s !== 'todas' && s !== 'todos');
        };

        const municipiosFilter = parseListParam(id_municipio);
        const periodosFilter = parseListParam(id_periodo);
        const variablesFilter = agruparVariables ? [] : parseListParam(id_variable);

        // 4. Heatmap Map Data
        let mapSql = `
            SELECT 
                m.id_municipio, 
                m.codigo_municipio,
                m.nombre as nombre_municipio, 
                COALESCE(SUM(CAST(v.valor AS DECIMAL(15,4))), 0) as total
            FROM indicador_registros r
            JOIN municipios m ON r.id_municipio = m.id_municipio
            JOIN indicador_valores v ON r.id_registro = v.id_registro
            JOIN indicador_variables var ON v.id_variable = var.id_variable
            WHERE r.id_indicador = ? 
            AND var.tipo = 'numero'
        `;
        const mapParams = [idIndicador];

        if (periodosFilter.length > 0) {
            mapSql += ` AND r.id_periodo IN (${periodosFilter.map(() => '?').join(',')})`;
            mapParams.push(...periodosFilter);
        }
        if (municipiosFilter.length > 0) {
            mapSql += ` AND (m.codigo_municipio IN (${municipiosFilter.map(() => '?').join(',')}) OR m.id_municipio IN (${municipiosFilter.map(() => '?').join(',')}))`;
            mapParams.push(...municipiosFilter, ...municipiosFilter);
        }
        if (variablesFilter.length > 0) {
            mapSql += ` AND v.id_variable IN (${variablesFilter.map(() => '?').join(',')})`;
            mapParams.push(...variablesFilter);
        }
        if (dimension_valor && dimension_valor !== 'all') {
            mapSql += ` AND EXISTS (
                SELECT 1 FROM indicador_valores v_dim 
                JOIN indicador_variables iv_dim ON v_dim.id_variable = iv_dim.id_variable 
                WHERE v_dim.id_registro = r.id_registro AND iv_dim.tipo = 'texto' AND v_dim.valor = ?
            )`;
            mapParams.push(dimension_valor);
        }

        mapSql += ' GROUP BY m.id_municipio, m.codigo_municipio, m.nombre';
        const [mapRows] = await pool.query(mapSql, mapParams);

        // Helper to format period label
        const formatPeriodLabel = (row, modo) => {
            if (modo === 'todos') return 'Total Consolidado';
            if (modo === 'anio') return String(row.anio);

            const anio = row.anio;
            const num = row.numero;
            const tipo = row.tipo_periodo || row.tipo;

            if (tipo === 'semestral') {
                const sem = num === 1 ? 'A' : (num === 2 ? 'B' : String(num));
                return `${anio}${sem}`;
            }
            if (tipo === 'trimestral') {
                return `${anio}-T${num || 1}`;
            }
            if (tipo === 'mensual') {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${anio} - ${meses[(num || 1) - 1] || 'M' + num}`;
            }
            if (tipo === 'salud') {
                return `${anio} - S${String(num || 1).padStart(2, '0')}`;
            }
            return String(anio);
        };

        // If Detailed Microdata Mode
        if (fuente_datos === 'detallada') {
            let rawSql = `
                SELECT 
                    r.id_registro,
                    m.nombre as municipio,
                    m.codigo_municipio,
                    p.id_periodo, p.anio, p.numero, p.tipo as tipo_periodo,
                    v.id_variable,
                    v.valor
                FROM indicador_registros r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN periodos p ON r.id_periodo = p.id_periodo
                JOIN indicador_valores v ON r.id_registro = v.id_registro
                WHERE r.id_indicador = ?
            `;
            const rawParams = [idIndicador];
            if (periodosFilter.length > 0) {
                rawSql += ` AND r.id_periodo IN (${periodosFilter.map(() => '?').join(',')})`;
                rawParams.push(...periodosFilter);
            }
            if (municipiosFilter.length > 0) {
                rawSql += ` AND (m.codigo_municipio IN (${municipiosFilter.map(() => '?').join(',')}) OR m.id_municipio IN (${municipiosFilter.map(() => '?').join(',')}))`;
                rawParams.push(...municipiosFilter, ...municipiosFilter);
            }
            if (dimension_valor && dimension_valor !== 'all') {
                rawSql += ` AND EXISTS (
                    SELECT 1 FROM indicador_valores v_dim 
                    JOIN indicador_variables iv_dim ON v_dim.id_variable = iv_dim.id_variable 
                    WHERE v_dim.id_registro = r.id_registro AND iv_dim.tipo = 'texto' AND v_dim.valor = ?
                )`;
                rawParams.push(dimension_valor);
            }

            const [rawRows] = await pool.query(rawSql, rawParams);

            const flatDataMap = new Map();
            for (const row of rawRows) {
                if (!flatDataMap.has(row.id_registro)) {
                    let per = formatPeriodLabel(row, modoPeriodo);
                    flatDataMap.set(row.id_registro, {
                        id_registro: row.id_registro,
                        municipio: row.municipio,
                        periodo: per
                    });
                }
                const varDef = allVariables.find(v => v.id_variable === row.id_variable);
                if (varDef) {
                    let val = row.valor;
                    if (varDef.tipo === 'numero') val = parseFloat(val) || 0;
                    flatDataMap.get(row.id_registro)[varDef.nombre] = val;
                }
            }

            return {
                fuente_datos: 'detallada',
                mapData: mapRows,
                variables: allVariables,
                dimensionOptions,
                flatData: Array.from(flatDataMap.values())
            };
        }

        // Standard Agrupada Mode
        // Fetch all distinct periods available for this indicator
        const [availablePeriodos] = await pool.query(`
            SELECT DISTINCT p.id_periodo, p.anio, p.numero, p.tipo
            FROM periodos p
            JOIN indicador_registros r ON p.id_periodo = r.id_periodo
            WHERE r.id_indicador = ?
            ORDER BY p.anio ASC, p.numero ASC
        `, [idIndicador]);

        // Build main aggregation query
        let selectFields = '';
        let groupByFields = '';
        let orderByFields = '';

        if (agruparMunicipios) {
            if (modoPeriodo === 'todos') {
                selectFields = `
                    'Total' as anio,
                    'todos' as id_periodo,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'var.orden ASC';
            } else if (modoPeriodo === 'anio') {
                selectFields = `
                    p.anio,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'p.anio, v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'p.anio ASC, var.orden ASC';
            } else {
                // Modo ninguno (detallado)
                selectFields = `
                    p.id_periodo,
                    p.anio,
                    p.numero,
                    p.tipo as tipo_periodo,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'p.id_periodo, p.anio, p.numero, p.tipo, v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'p.anio ASC, p.numero ASC, var.orden ASC';
            }
        } else {
            // Desglosado por municipio
            if (modoPeriodo === 'todos') {
                selectFields = `
                    m.id_municipio,
                    m.nombre as municipio_nombre,
                    m.codigo_municipio,
                    'Total' as anio,
                    'todos' as id_periodo,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'm.id_municipio, m.nombre, m.codigo_municipio, v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'm.nombre ASC, var.orden ASC';
            } else if (modoPeriodo === 'anio') {
                selectFields = `
                    m.id_municipio,
                    m.nombre as municipio_nombre,
                    m.codigo_municipio,
                    p.anio,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'm.id_municipio, m.nombre, m.codigo_municipio, p.anio, v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'm.nombre ASC, p.anio ASC, var.orden ASC';
            } else {
                selectFields = `
                    m.id_municipio,
                    m.nombre as municipio_nombre,
                    m.codigo_municipio,
                    p.id_periodo,
                    p.anio,
                    p.numero,
                    p.tipo as tipo_periodo,
                    v.id_variable,
                    var.nombre as variable_nombre,
                    var.unidad as variable_unidad,
                    var.orden,
                    SUM(CAST(v.valor AS DECIMAL(15,4))) as valor_total
                `;
                groupByFields = 'm.id_municipio, m.nombre, m.codigo_municipio, p.id_periodo, p.anio, p.numero, p.tipo, v.id_variable, var.nombre, var.unidad, var.orden';
                orderByFields = 'm.nombre ASC, p.anio ASC, p.numero ASC, var.orden ASC';
            }
        }

        let mainSql = `
            SELECT ${selectFields}
            FROM indicador_registros r
            JOIN periodos p ON r.id_periodo = p.id_periodo
            JOIN indicador_valores v ON r.id_registro = v.id_registro
            JOIN indicador_variables var ON v.id_variable = var.id_variable
            JOIN municipios m ON r.id_municipio = m.id_municipio
            WHERE r.id_indicador = ?
        `;
        const mainParams = [idIndicador];

        if (variablesFilter.length > 0) {
            mainSql += ` AND v.id_variable IN (${variablesFilter.map(() => '?').join(',')})`;
            mainParams.push(...variablesFilter);
        } else {
            mainSql += " AND var.tipo = 'numero'";
        }

        if (periodosFilter.length > 0) {
            mainSql += ` AND r.id_periodo IN (${periodosFilter.map(() => '?').join(',')})`;
            mainParams.push(...periodosFilter);
        }

        if (municipiosFilter.length > 0) {
            mainSql += ` AND (m.codigo_municipio IN (${municipiosFilter.map(() => '?').join(',')}) OR m.id_municipio IN (${municipiosFilter.map(() => '?').join(',')}))`;
            mainParams.push(...municipiosFilter, ...municipiosFilter);
        }

        if (dimension_valor && dimension_valor !== 'all') {
            mainSql += ` AND EXISTS (
                SELECT 1 FROM indicador_valores v_dim 
                JOIN indicador_variables iv_dim ON v_dim.id_variable = iv_dim.id_variable 
                WHERE v_dim.id_registro = r.id_registro AND iv_dim.tipo = 'texto' AND v_dim.valor = ?
            )`;
            mainParams.push(dimension_valor);
        }

        mainSql += ` GROUP BY ${groupByFields} ORDER BY ${orderByFields}`;

        const [aggRows] = await pool.query(mainSql, mainParams);

        // Transform results into multi-series chart and Excel table format
        const seriesMap = new Map();
        const tableRowsMap = new Map();
        const periodLabelsOrdered = [];
        const seenLabels = new Set();
        const distinctMunicipiosMap = new Map();

        for (const row of aggRows) {
            const periodLabel = formatPeriodLabel(row, modoPeriodo);
            if (!seenLabels.has(periodLabel)) {
                seenLabels.add(periodLabel);
                periodLabelsOrdered.push(periodLabel);
            }

            const val = parseFloat(row.valor_total) || 0;

            // When grouped by municipalities
            if (agruparMunicipios) {
                if (!seriesMap.has(periodLabel)) {
                    seriesMap.set(periodLabel, {
                        name: periodLabel,
                        anio: row.anio,
                        numero: row.numero,
                        id_periodo: row.id_periodo,
                        Total_General: 0
                    });
                }
                const sObj = seriesMap.get(periodLabel);
                sObj[row.variable_nombre] = val;
                sObj.Total_General = (sObj.Total_General || 0) + val;

                // Excel-style table rows
                if (!tableRowsMap.has(row.id_variable)) {
                    tableRowsMap.set(row.id_variable, {
                        id_variable: row.id_variable,
                        nombre: row.variable_nombre,
                        unidad: row.variable_unidad || '',
                        displayName: `Suma de ${row.variable_nombre}${row.variable_unidad ? ` (${row.variable_unidad})` : ''}`,
                        values: {},
                        total: 0
                    });
                }
                const tRow = tableRowsMap.get(row.id_variable);
                tRow.values[periodLabel] = val;
                tRow.total += val;
            } else {
                // When NOT grouped by municipalities
                const munKey = row.municipio_nombre || 'Desconocido';
                if (!distinctMunicipiosMap.has(munKey)) {
                    distinctMunicipiosMap.set(munKey, {
                        id_municipio: row.id_municipio,
                        codigo_municipio: row.codigo_municipio,
                        nombre: munKey,
                        series: new Map(),
                        tableRows: new Map()
                    });
                }
                const mData = distinctMunicipiosMap.get(munKey);
                if (!mData.series.has(periodLabel)) {
                    mData.series.set(periodLabel, {
                        name: periodLabel,
                        municipio: munKey,
                        anio: row.anio,
                        Total_General: 0
                    });
                }
                const msObj = mData.series.get(periodLabel);
                msObj[row.variable_nombre] = val;
                msObj.Total_General = (msObj.Total_General || 0) + val;

                if (!mData.tableRows.has(row.id_variable)) {
                    mData.tableRows.set(row.id_variable, {
                        id_variable: row.id_variable,
                        nombre: row.variable_nombre,
                        unidad: row.variable_unidad || '',
                        displayName: `Suma de ${row.variable_nombre}${row.variable_unidad ? ` (${row.variable_unidad})` : ''}`,
                        values: {},
                        total: 0
                    });
                }
                const mtRow = mData.tableRows.get(row.id_variable);
                mtRow.values[periodLabel] = val;
                mtRow.total += val;
            }
        }

        // Prepare table data and chart series
        let finalSeries = [];
        let finalTable = { columns: periodLabelsOrdered, rows: [] };
        let municipiosBreakdown = null;

        if (agruparMunicipios) {
            finalSeries = Array.from(seriesMap.values());
            finalTable.rows = Array.from(tableRowsMap.values());
        } else {
            // Build disaggregated list per municipality
            municipiosBreakdown = Array.from(distinctMunicipiosMap.values()).map(m => ({
                id_municipio: m.id_municipio,
                codigo_municipio: m.codigo_municipio,
                nombre: m.nombre,
                series: Array.from(m.series.values()),
                table: {
                    columns: periodLabelsOrdered,
                    rows: Array.from(m.tableRows.values())
                }
            }));

            // For the main series, combine them with municipality label
            finalSeries = municipiosBreakdown.flatMap(m => m.series);
            // Default table uses first municipality or overall
            if (municipiosBreakdown.length > 0) {
                finalTable = municipiosBreakdown[0].table;
            }
        }

        // Legacy charts compatibility for LandingPage:
        const legacyCharts = [];
        if (finalTable.rows.length > 0) {
            for (const r of finalTable.rows) {
                legacyCharts.push({
                    dimensionId: String(r.id_variable),
                    dimensionName: r.displayName,
                    data: periodLabelsOrdered.map(col => ({
                        name: col,
                        value: r.values[col] || 0,
                        unit: r.unidad
                    }))
                });
            }
        } else if (mapRows.length > 0) {
            legacyCharts.push({
                dimensionId: 'totales',
                dimensionName: 'Totales por Municipio',
                data: mapRows.map(m => ({
                    name: m.nombre_municipio,
                    value: m.total
                }))
            });
        }

        return {
            fuente_datos: 'agrupada',
            agrupado_municipios: agruparMunicipios,
            modo_periodos: modoPeriodo,
            agrupado_variables: agruparVariables,
            variables: numVars,
            dimensiones: textDims,
            dimensionOptions,
            periodos: availablePeriodos,
            series: finalSeries,
            table: finalTable,
            municipiosBreakdown,
            mapData: mapRows,
            charts: legacyCharts
        };
    }
}

module.exports = IndicadoresDAO;
