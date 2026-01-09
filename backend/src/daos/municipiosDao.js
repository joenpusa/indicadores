const pool = require('../config/db');

class MunicipiosDAO {
    static async getAll(filters = {}) {
        let sql = `
            SELECT m.*, z.nombre as nombre_zona 
            FROM municipios m
            LEFT JOIN zona_departamento z ON m.id_zona = z.id_zona
        `;
        let countSql = 'SELECT COUNT(*) as total FROM municipios m';

        const params = [];
        const whereClauses = [];

        // Always filter by active unless specified otherwise (or standard behavior)
        // Similar to secretarias, we might want to see inactive ones too if needed, but usually we filter.
        // Secretarias had: if (filters.active === 'true' ...)
        if (filters.active === 'true' || filters.active === true) {
            whereClauses.push('m.activo = 1');
        }

        if (filters.q) {
            whereClauses.push('(m.nombre LIKE ? OR m.codigo_municipio LIKE ?)');
            params.push(`%${filters.q}%`);
            params.push(`%${filters.q}%`);
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            countSql += whereClause;
        }

        sql += ' ORDER BY m.activo DESC, m.nombre ASC';

        // Pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        sql += ' LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [rows] = await pool.query(sql, queryParams);
        const [countResult] = await pool.query(countSql, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        };
    }

    static async create(data) {
        const { codigo_municipio, nombre, id_zona, activo } = data;
        // Default id_departamento to 54 if not present (DB defaults it too, but we can be explicit if needed)
        const [result] = await pool.query(
            'INSERT INTO municipios (codigo_municipio, nombre, id_zona, activo, id_departamento) VALUES (?, ?, ?, ?, 54)',
            [codigo_municipio, nombre, id_zona, activo ? 1 : 0]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { codigo_municipio, nombre, id_zona, activo } = data;
        await pool.query(
            'UPDATE municipios SET codigo_municipio = ?, nombre = ?, id_zona = ?, activo = ? WHERE id_municipio = ?',
            [codigo_municipio, nombre, id_zona, activo ? 1 : 0, id]
        );
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM municipios WHERE id_municipio = ?', [id]);
        return rows[0];
    }
}

module.exports = MunicipiosDAO;
