const pool = require('../config/db');

class ZonaDepartamentoDAO {
    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM zona_departamento WHERE activo = 1 ORDER BY nombre ASC');
        return rows;
    }
}

module.exports = ZonaDepartamentoDAO;
