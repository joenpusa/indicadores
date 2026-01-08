const pool = require('../config/db');

class SecretariasDAO {
    static async getAll(filters = {}) {
        let sql = 'SELECT * FROM secretarias';
        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('nombre LIKE ?');
            params.push(`%${filters.q}%`);
        }

        if (filters.active === 'true' || filters.active === true) {
            whereClauses.push('es_activo = 1');
        }

        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        sql += ' ORDER BY es_activo DESC, nombre ASC';

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    static async create(data) {
        const { nombre } = data;
        const [result] = await pool.query('INSERT INTO secretarias (nombre) VALUES (?)', [nombre]);
        return result.insertId;
    }

    static async update(id, data) {
        const { nombre, es_activo } = data;
        await pool.query('UPDATE secretarias SET nombre = ?, es_activo = ? WHERE id_secretaria = ?', [nombre, es_activo, id]);
        return true;
    }

    static async delete(id) {
        await pool.query('UPDATE secretarias SET es_activo = 0 WHERE id_secretaria = ?', [id]);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM secretarias WHERE id_secretaria = ?', [id]);
        return rows[0];
    }
}

module.exports = SecretariasDAO;
