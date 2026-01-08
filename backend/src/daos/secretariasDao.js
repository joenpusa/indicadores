const pool = require('../config/db');

class SecretariasDAO {
    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM secretarias');
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
