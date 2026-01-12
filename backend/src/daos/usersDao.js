const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class UsersDAO {
    static async getAll(filters = {}) {
        let sql = `
            SELECT u.*, r.nombre_rol, s.nombre as nombre_secretaria 
            FROM users u 
            JOIN roles r ON u.rol_id = r.rol_id 
            LEFT JOIN secretarias s ON u.id_secretaria = s.id_secretaria
        `;
        let countSql = 'SELECT COUNT(*) as total FROM users u';
        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('(u.nombre LIKE ? OR u.email LIKE ?)');
            params.push(`%${filters.q}%`);
            params.push(`%${filters.q}%`);
        }

        if (filters.active === 'true' || filters.active === true) {
            whereClauses.push('u.es_activo = 1');
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            countSql += whereClause;
        }

        sql += ' ORDER BY u.nombre ASC';

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        sql += ' LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [rows] = await pool.query(sql, queryParams);
        const [countResult] = await pool.query(countSql, params);

        // Remove passwords from response
        const safeRows = rows.map(user => {
            const { password, ...rest } = user;
            return rest;
        });

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            data: safeRows,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        };
    }

    static async create(data) {
        const { email, nombre, rol_id, id_secretaria, password } = data;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (email, nombre, rol_id, id_secretaria, password) VALUES (?, ?, ?, ?, ?)',
            [email, nombre, rol_id, id_secretaria, hashedPassword]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { email, nombre, rol_id, id_secretaria, es_activo, password } = data;
        let sql = 'UPDATE users SET email = ?, nombre = ?, rol_id = ?, id_secretaria = ?, es_activo = ?';
        let params = [email, nombre, rol_id, id_secretaria, es_activo];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            sql += ', password = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id_usuario = ?';
        params.push(id);

        await pool.query(sql, params);
        return true;
    }

    static async delete(id) {
        // Logical delete
        await pool.query('UPDATE users SET es_activo = 0 WHERE id_usuario = ?', [id]);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id_usuario = ?', [id]);
        if (rows.length === 0) return null;
        const { password, ...user } = rows[0];
        return user;
    }
}

module.exports = UsersDAO;
