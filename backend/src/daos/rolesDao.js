const pool = require('../config/db');

class RolesDAO {
    static async getAll(filters = {}) {
        let sql = 'SELECT r.*, s.nombre as nombre_secretaria FROM roles r LEFT JOIN secretarias s ON r.id_secretaria = s.id_secretaria';
        let countSql = 'SELECT COUNT(*) as total FROM roles r';
        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('r.nombre_rol LIKE ?');
            params.push(`%${filters.q}%`);
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            countSql += whereClause;
        }

        sql += ' ORDER BY r.nombre_rol ASC';

        // Pagination parameters
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        sql += ' LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [rows] = await pool.query(sql, queryParams);
        const [countResult] = await pool.query(countSql, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        };
    }

    static async create(data) {
        const { nombre_rol, tipo_permiso, id_secretaria } = data;
        const [result] = await pool.query(
            'INSERT INTO roles (nombre_rol, tipo_permiso, id_secretaria) VALUES (?, ?, ?)',
            [nombre_rol, tipo_permiso || 'consultar', id_secretaria || null]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { nombre_rol, tipo_permiso, id_secretaria } = data;
        await pool.query(
            'UPDATE roles SET nombre_rol = ?, tipo_permiso = ?, id_secretaria = ? WHERE rol_id = ?',
            [nombre_rol, tipo_permiso || 'consultar', id_secretaria || null, id]
        );
        return true;
    }

    static async delete(id) {
        await pool.query('DELETE FROM roles WHERE rol_id = ?', [id]);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT r.*, s.nombre as nombre_secretaria FROM roles r LEFT JOIN secretarias s ON r.id_secretaria = s.id_secretaria WHERE r.rol_id = ?', [id]);
        return rows[0];
    }
}

module.exports = RolesDAO;
