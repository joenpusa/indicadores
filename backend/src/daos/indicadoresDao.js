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
}

module.exports = IndicadoresDAO;
