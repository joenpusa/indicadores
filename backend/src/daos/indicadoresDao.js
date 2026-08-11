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

    static async getDashboardData(idIndicador, filters) {
        const { id_periodo, active } = filters;

        // 0. Fetch indicator to check fuente_datos
        const [indRows] = await pool.query('SELECT fuente_datos FROM indicadores WHERE id_indicador = ?', [idIndicador]);
        if (indRows.length === 0) throw new Error('Indicador no encontrado');
        const fuente_datos = indRows[0].fuente_datos || 'agrupada';

        // 1. Get Map Data (Heatmap) - Sum of all numeric variables per municipality
        let mapSql = `
            SELECT 
                m.id_municipio, 
                m.codigo_municipio,
                m.nombre as nombre_municipio, 
                COALESCE(SUM(v.valor), 0) as total
            FROM indicador_registros r
            JOIN municipios m ON r.id_municipio = m.id_municipio
            JOIN indicador_valores v ON r.id_registro = v.id_registro
            JOIN indicador_variables var ON v.id_variable = var.id_variable
            WHERE r.id_indicador = ? 
            AND var.tipo = 'numero'
        `;

        const mapParams = [idIndicador];

        if (id_periodo) {
            mapSql += ' AND r.id_periodo = ?';
            mapParams.push(id_periodo);
        }

        if (filters.id_municipio) {
            mapSql += ' AND m.codigo_municipio = ?';
            mapParams.push(filters.id_municipio);
        }

        if (filters.id_variable) {
            mapSql += ' AND v.id_variable = ?';
            mapParams.push(filters.id_variable);
        }

        mapSql += ' GROUP BY m.id_municipio, m.codigo_municipio, m.nombre';
        const [mapRows] = await pool.query(mapSql, mapParams);

        if (fuente_datos === 'detallada') {
            // Get all variables
            const [variables] = await pool.query('SELECT * FROM indicador_variables WHERE id_indicador = ? ORDER BY orden ASC', [idIndicador]);
            
            // Get raw flat data for interactive pivot
            let rawSql = `
                SELECT 
                    r.id_registro,
                    m.nombre as municipio,
                    p.anio, p.numero, p.tipo as tipo_periodo,
                    v.id_variable,
                    v.valor
                FROM indicador_registros r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN periodos p ON r.id_periodo = p.id_periodo
                JOIN indicador_valores v ON r.id_registro = v.id_registro
                WHERE r.id_indicador = ?
            `;
            const rawParams = [idIndicador];
            if (id_periodo) {
                rawSql += ' AND r.id_periodo = ?';
                rawParams.push(id_periodo);
            }
            if (filters.id_municipio) {
                rawSql += ' AND m.codigo_municipio = ?';
                rawParams.push(filters.id_municipio);
            }

            const [rawRows] = await pool.query(rawSql, rawParams);
            
            const flatDataMap = new Map();
            for (const row of rawRows) {
                if (!flatDataMap.has(row.id_registro)) {
                    let per = row.anio.toString();
                    if (row.tipo_periodo === 'mensual') per = `${row.anio}-${String(row.numero).padStart(2, '0')}`;
                    else if (row.tipo_periodo === 'semestral') per = `${row.anio}-S${row.numero}`;
                    else if (row.tipo_periodo === 'trimestral') per = `${row.anio}-T${row.numero}`;
                    else if (row.tipo_periodo === 'salud') per = `${row.anio} - Salud ${String(row.numero).padStart(2, '0')}`;

                    flatDataMap.set(row.id_registro, {
                        id_registro: row.id_registro,
                        municipio: row.municipio,
                        periodo: per
                    });
                }
                const varDef = variables.find(v => v.id_variable === row.id_variable);
                if (varDef) {
                    let val = row.valor;
                    if (varDef.tipo === 'numero') val = parseFloat(val) || 0;
                    flatDataMap.get(row.id_registro)[varDef.nombre] = val;
                }
            }

            return {
                fuente_datos: 'detallada',
                mapData: mapRows,
                variables: variables,
                flatData: Array.from(flatDataMap.values())
            };
        }

        // Mode agrupada
        const [dimensions] = await pool.query(
            'SELECT * FROM indicador_variables WHERE id_indicador = ? AND es_dimension = 1 AND tipo = "texto" ORDER BY orden ASC',
            [idIndicador]
        );

        const charts = [];
        for (const dim of dimensions) {
            let chartSql = `
                SELECT 
                    CONCAT(m.nombre, ' - ', v_dim.valor, ' - ', p.anio) as name,
                    SUM(v_num.valor) as value,
                    var_num.unidad as unit
                FROM indicador_registros r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN periodos p ON r.id_periodo = p.id_periodo
                JOIN indicador_valores v_dim ON r.id_registro = v_dim.id_registro
                JOIN indicador_valores v_num ON r.id_registro = v_num.id_registro
                JOIN indicador_variables var_num ON v_num.id_variable = var_num.id_variable
                WHERE r.id_indicador = ?
                AND v_dim.id_variable = ?
                AND var_num.tipo = 'numero'
            `;

            const chartParams = [idIndicador, dim.id_variable];

            if (id_periodo) {
                chartSql += ' AND r.id_periodo = ?';
                chartParams.push(id_periodo);
            }

            if (filters.id_municipio) {
                chartSql += ' AND m.codigo_municipio = ?';
                chartParams.push(filters.id_municipio);
            }

            if (filters.id_variable) {
                chartSql += ' AND v_num.id_variable = ?';
                chartParams.push(filters.id_variable);
            }

            chartSql += ' GROUP BY m.nombre, v_dim.valor, p.anio, var_num.unidad ORDER BY p.anio DESC, m.nombre ASC';

            const [chartRows] = await pool.query(chartSql, chartParams);

            charts.push({
                dimensionId: dim.id_variable,
                dimensionName: dim.nombre,
                data: chartRows
            });
        }

        if (charts.length === 0) {
            // Default chart for aggregated if no text variables
            let defSql = `
                SELECT 
                    m.nombre as name,
                    SUM(v.valor) as value,
                    var.unidad as unit
                FROM indicador_registros r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN indicador_valores v ON r.id_registro = v.id_registro
                JOIN indicador_variables var ON v.id_variable = var.id_variable
                WHERE r.id_indicador = ? AND var.tipo = 'numero'
            `;
            const defParams = [idIndicador];
            if (id_periodo) { defSql += ' AND r.id_periodo = ?'; defParams.push(id_periodo); }
            if (filters.id_municipio) { defSql += ' AND m.codigo_municipio = ?'; defParams.push(filters.id_municipio); }
            if (filters.id_variable) { defSql += ' AND var.id_variable = ?'; defParams.push(filters.id_variable); }

            defSql += ' GROUP BY m.nombre, var.unidad ORDER BY m.nombre ASC';
            const [defRows] = await pool.query(defSql, defParams);

            if (defRows.length > 0) {
                charts.push({
                    dimensionId: 'default',
                    dimensionName: 'Totales por Municipio',
                    data: defRows
                });
            }
        }

        return {
            fuente_datos: 'agrupada',
            mapData: mapRows,
            charts: charts
        };
    }
}

module.exports = IndicadoresDAO;
