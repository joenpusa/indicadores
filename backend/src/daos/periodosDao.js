const pool = require('../config/db');

class PeriodosDAO {
    static async getAll() {
        const [rows] = await pool.query("SELECT *, CONCAT(anio, '-', numero) as nombre FROM periodos ORDER BY anio DESC, numero DESC");
        return rows;
    }

    static async getByAnio(anio) {
        const [rows] = await pool.query("SELECT *, CONCAT(anio, '-', numero) as nombre FROM periodos WHERE anio = ? ORDER BY fecha_inicio ASC", [anio]);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query("SELECT *, CONCAT(anio, '-', numero) as nombre FROM periodos WHERE id_periodo = ?", [id]);
        return rows[0];
    }

    static async create(data) {
        const { tipo, anio, numero, fecha_inicio, fecha_fin } = data;
        const [result] = await pool.query(
            'INSERT INTO periodos (tipo, anio, numero, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
            [tipo, anio, numero, fecha_inicio, fecha_fin]
        );
        return result.insertId;
    }
}

module.exports = PeriodosDAO;
