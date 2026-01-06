const pool = require('../config/db');
const User = require('../models/User');

class UserDAO {
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id_usuario = ?', [id]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    static async create(userData) {
        const { email, nombre, rol_id, password, es_activo, id_secretaria } = userData;
        const [result] = await pool.query(
            'INSERT INTO users (email, nombre, rol_id, password, es_activo, id_secretaria) VALUES (?, ?, ?, ?, ?, ?)',
            [email, nombre, rol_id, password, es_activo || 1, id_secretaria]
        );
        return result.insertId;
    }
}

module.exports = UserDAO;
