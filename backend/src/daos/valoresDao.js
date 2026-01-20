const pool = require('../config/db');

class ValoresDAO {
    static async createBatch(values) {
        if (!values || values.length === 0) return 0;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const query = 'INSERT INTO indicador_valores (id_registro, id_variable, valor) VALUES ?';
            const flattenedValues = values.map(v => [v.id_registro, v.id_variable, v.valor]);

            const [result] = await connection.query(query, [flattenedValues]);

            await connection.commit();
            return result.affectedRows;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByRegistro(idRegistro) {
        const [rows] = await pool.query('SELECT * FROM indicador_valores WHERE id_registro = ?', [idRegistro]);
        return rows;
    }
}

module.exports = ValoresDAO;
