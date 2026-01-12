const pool = require('../config/db');

class RolesDAO {
    static async getAll(filters = {}) {
        let sql = 'SELECT * FROM roles';
        let countSql = 'SELECT COUNT(*) as total FROM roles';
        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('nombre_rol LIKE ?');
            params.push(`%${filters.q}%`);
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            countSql += whereClause;
        }

        sql += ' ORDER BY nombre_rol ASC';

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
        const { nombre_rol } = data;
        const [result] = await pool.query('INSERT INTO roles (nombre_rol) VALUES (?)', [nombre_rol]);
        return result.insertId;
    }

    static async update(id, data) {
        const { nombre_rol } = data;
        await pool.query('UPDATE roles SET nombre_rol = ? WHERE rol_id = ?', [nombre_rol, id]);
        return true;
    }

    static async delete(id) {
        // Warning: Deleting a role might have cascading effects? User just asked for CRUD.
        // Secretarias does logical delete (es_activo = 0).
        // Roles table has no `es_activo`. So we must perform potentially real delete.
        // Or user expects update?
        // "cree esta tabla... rol_id, nombre_rol" -> No active column.
        // I will implement DELETE.
        await pool.query('DELETE FROM roles WHERE rol_id = ?', [id]);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM roles WHERE rol_id = ?', [id]);
        return rows[0];
    }
}

module.exports = RolesDAO;
