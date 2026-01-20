const pool = require('../config/db');

class GraficosDAO {
    static async getByIndicador(idIndicador) {
        const [rows] = await pool.query('SELECT * FROM indicador_graficos WHERE id_indicador = ?', [idIndicador]);
        return rows[0]; // Assuming 1 config per indicator for now based on requirements, or list if multiple allowed. Requirements imply "Configurar visualización" singular.
    }

    static async create(data) {
        const { id_indicador, tipo, variable_x, variable_y } = data;
        const [result] = await pool.query(
            'INSERT INTO indicador_graficos (id_indicador, tipo, variable_x, variable_y) VALUES (?, ?, ?, ?)',
            [id_indicador, tipo, variable_x, variable_y]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo); }
        if (data.variable_x !== undefined) { fields.push('variable_x = ?'); params.push(data.variable_x); }
        if (data.variable_y !== undefined) { fields.push('variable_y = ?'); params.push(data.variable_y); }

        if (fields.length === 0) return false;

        params.push(id);

        await pool.query(`UPDATE indicador_graficos SET ${fields.join(', ')} WHERE id_grafico = ?`, params);
        return true;
    }

    // Helper to update by indicator ID if we treat it as 1-to-1
    static async updateByIndicador(idIndicador, data) {
        const fields = [];
        const params = [];

        if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo); }
        if (data.variable_x !== undefined) { fields.push('variable_x = ?'); params.push(data.variable_x); }
        if (data.variable_y !== undefined) { fields.push('variable_y = ?'); params.push(data.variable_y); }

        if (fields.length === 0) return false;

        params.push(idIndicador);

        await pool.query(`UPDATE indicador_graficos SET ${fields.join(', ')} WHERE id_indicador = ?`, params);
        return true;
    }

    static async delete(id) {
        await pool.query('DELETE FROM indicador_graficos WHERE id_grafico = ?', [id]);
        return true;
    }
}

module.exports = GraficosDAO;
