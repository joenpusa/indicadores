const pool = require('../config/db');

class VariablesDAO {
    static async getByIndicador(idIndicador) {
        const [rows] = await pool.query(
            'SELECT * FROM indicador_variables WHERE id_indicador = ? ORDER BY orden ASC',
            [idIndicador]
        );
        return rows;
    }

    static async create(data) {
        const { id_indicador, nombre, tipo, unidad, es_dimension, es_obligatoria, orden } = data;
        const [result] = await pool.query(
            `INSERT INTO indicador_variables 
            (id_indicador, nombre, tipo, unidad, es_dimension, es_obligatoria, orden) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_indicador, nombre, tipo, unidad, es_dimension, es_obligatoria, orden]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
        if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo); }
        if (data.unidad !== undefined) { fields.push('unidad = ?'); params.push(data.unidad); }
        if (data.es_dimension !== undefined) { fields.push('es_dimension = ?'); params.push(data.es_dimension); }
        if (data.es_obligatoria !== undefined) { fields.push('es_obligatoria = ?'); params.push(data.es_obligatoria); }
        if (data.orden !== undefined) { fields.push('orden = ?'); params.push(data.orden); }

        if (fields.length === 0) return false;

        params.push(id);

        await pool.query(`UPDATE indicador_variables SET ${fields.join(', ')} WHERE id_variable = ?`, params);
        return true;
    }

    static async delete(id) {
        await pool.query('DELETE FROM indicador_variables WHERE id_variable = ?', [id]);
        return true;
    }
}

module.exports = VariablesDAO;
