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
        const { id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad } = data;
        const [result] = await pool.query(
            'INSERT INTO indicadores (id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad) VALUES (?, ?, ?, ?, ?, ?)',
            [id_secretaria, nombre, descripcion, unidad_base, es_activo, periodicidad]
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

    static async getDashboardData(idIndicador, filters) {
        const { id_periodo, active } = filters;

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

        // Add filter for active indicator if needed, but normally we are viewing a specific indicator.
        // If "active" param refers to the indicator status, it's already checked in controller/model 
        // before calling this (or irrelevant if we already have the ID).

        mapSql += ' GROUP BY m.id_municipio, m.codigo_municipio, m.nombre';

        const [mapRows] = await pool.query(mapSql, mapParams);

        // 2. Get Dimensions (Only Text type)
        const [dimensions] = await pool.query(
            'SELECT * FROM indicador_variables WHERE id_indicador = ? AND es_dimension = 1 AND tipo = "texto" ORDER BY orden ASC',
            [idIndicador]
        );

        // 3. Get Chart Data for each dimension
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

            chartSql += ' GROUP BY m.nombre, v_dim.valor, p.anio, var_num.unidad ORDER BY p.anio DESC, m.nombre ASC';

            const [chartRows] = await pool.query(chartSql, chartParams);

            charts.push({
                dimensionId: dim.id_variable,
                dimensionName: dim.nombre,
                data: chartRows
            });
        }

        return {
            mapData: mapRows,
            charts: charts
        };
    }
}

module.exports = IndicadoresDAO;
