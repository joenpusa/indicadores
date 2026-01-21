const pool = require('../config/db');

class RegistrosDAO {
    static async create(data) {
        const { id_indicador, id_municipio, id_periodo, descripcion } = data;
        const [result] = await pool.query(
            'INSERT INTO indicador_registros (id_indicador, id_municipio, id_periodo, descripcion) VALUES (?, ?, ?, ?)',
            [id_indicador, id_municipio, id_periodo, descripcion]
        );
        return result.insertId;
    }

    static async getByIndicadorAndPeriodo(idIndicador, idPeriodo) {
        let sql = `SELECT r.*, m.nombre as nombre_municipio, p.tipo, p.anio, p.numero, m.codigo_municipio
             FROM indicador_registros r
             JOIN municipios m ON r.id_municipio = m.id_municipio
             JOIN periodos p ON r.id_periodo = p.id_periodo
             WHERE r.id_indicador = ?`;

        const params = [idIndicador];

        if (idPeriodo) {
            sql += ' AND r.id_periodo = ?';
            params.push(idPeriodo);
        }

        sql += ' ORDER BY p.anio DESC, p.numero DESC, m.nombre ASC';

        const [rows] = await pool.query(sql, params);
        return rows;
    }
    static async createBatch(records) {
        if (!records || records.length === 0) return [];

        // This is tricky with MySQL2 without executing one by one to get IDs, 
        // OR using INSERT ... VALUES ... RETURNING id (not supported in all MySQL versions).
        // For simplicity and safety, we might have to use a transaction and insert one by one 
        // OR insert all and then select them back if we have unique keys (indicador + municipio + periodo).
        // Assuming unique constraint on (id_indicador, id_municipio, id_periodo).

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const insertedIds = [];
            for (const record of records) {
                const [result] = await connection.query(
                    'INSERT INTO indicador_registros (id_indicador, id_municipio, id_periodo, descripcion) VALUES (?, ?, ?, ?)',
                    [record.id_indicador, record.id_municipio, record.id_periodo, record.descripcion || null]
                );
                insertedIds.push({ ...record, id_registro: result.insertId });
            }

            await connection.commit();
            return insertedIds;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getMunicipioIdByCode(code) {
        // Handle string/number issues
        const [rows] = await pool.query('SELECT id_municipio FROM municipios WHERE codigo_municipio = ? LIMIT 1', [code]);
        return rows.length > 0 ? rows[0].id_municipio : null;
    }

    static async getAllMunicipiosMap() {
        const [rows] = await pool.query('SELECT id_municipio, codigo_municipio FROM municipios');
        const map = new Map();
        rows.forEach(r => map.set(String(r.codigo_municipio), r.id_municipio));
        return map;
    }
}

module.exports = RegistrosDAO;
