const pool = require('../config/db');
const User = require('../models/User');

class UserDAO {
    static async findByEmail(email) {
        const sql = `
            SELECT u.*, r.nombre_rol, r.tipo_permiso, 
                   r.id_secretaria as id_secretaria,
                   s.nombre as nombre_secretaria
            FROM users u
            LEFT JOIN roles r ON u.rol_id = r.rol_id
            LEFT JOIN secretarias s ON r.id_secretaria = s.id_secretaria
            WHERE u.email = ?
        `;
        const [rows] = await pool.query(sql, [email]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    static async findById(id) {
        const sql = `
            SELECT u.*, r.nombre_rol, r.tipo_permiso, 
                   r.id_secretaria as id_secretaria,
                   s.nombre as nombre_secretaria
            FROM users u
            LEFT JOIN roles r ON u.rol_id = r.rol_id
            LEFT JOIN secretarias s ON r.id_secretaria = s.id_secretaria
            WHERE u.id_usuario = ?
        `;
        const [rows] = await pool.query(sql, [id]);
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
