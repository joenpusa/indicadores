const pool = require('../config/db');

class IndicadorPeriodicidadesDAO {
    static async create(idIndicador, tipo) {
        const [result] = await pool.query(
            'INSERT INTO indicador_periodicidades (id_indicador, tipo) VALUES (?, ?)',
            [idIndicador, tipo]
        );
        return result.insertId;
    }

    static async getByIndicador(idIndicador) {
        const [rows] = await pool.query(
            'SELECT * FROM indicador_periodicidades WHERE id_indicador = ?',
            [idIndicador]
        );
        return rows;
    }

    static async deleteAll(idIndicador) {
        await pool.query(
            'DELETE FROM indicador_periodicidades WHERE id_indicador = ?',
            [idIndicador]
        );
    }
}

module.exports = IndicadorPeriodicidadesDAO;
