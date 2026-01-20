const pool = require('../config/db');

class IndicadoresDAO {
    static async getAll(filters = {}) {
        let sql = `
            SELECT i.*, s.nombre as nombre_secretaria 
            FROM indicadores i
            JOIN secretarias s ON i.id_secretaria = s.id_secretaria
        `;
        let countSql = 'SELECT COUNT(*) as total FROM indicadores i';

        const params = [];
        const whereClauses = [];

        if (filters.q) {
            whereClauses.push('(i.nombre LIKE ? OR s.nombre LIKE ?)');
            params.push(`%${filters.q}%`);
            params.push(`%${filters.q}%`);
        }

        if (filters.active !== undefined && filters.active !== null) {
            whereClauses.push('i.es_activo = ?');
            params.push(filters.active);
        }

        if (filters.id_secretaria) {
            whereClauses.push('i.id_secretaria = ?');
            params.push(filters.id_secretaria);
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            sql += whereClause;
            countSql += whereClause; // Note: Joined table might be needed for count if filtering by secretaria name search, but for simple counts usually main table enough if filters don't depend on join. However, here q searches secretaria name, so we need join for count too if q is present. 
            // Correcting countSql to include join if needed or simple check.
            if (filters.q) {
                countSql = `
                    SELECT COUNT(*) as total 
                    FROM indicadores i
                    JOIN secretarias s ON i.id_secretaria = s.id_secretaria
                 ` + whereClause;
            } else {
                countSql += whereClause;
            }
        }

        sql += ' ORDER BY i.created_at DESC';

        if (filters.limit && filters.page) {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        // For count query, we need params without limit/offset
        // But we pushed limit/offset to params already. 
        // We need separate params array for count or slice it.
        // Let's refactor slightly to be safe.

        // Re-construct params for main query vs count query is cleaner.
        // But for time saving, let's just use slicing for countParams if we haven't pushed limit yet.
        // Wait, I pushed it. 

        // Let's redo parameters more cleanly in next step if needed, but here:
        const countParams = params.slice(0, params.length - (filters.limit && filters.page ? 2 : 0));

        const [rows] = await pool.query(sql, params);
        const [countResult] = await pool.query(countSql, countParams);

        const total = countResult[0].total;

        return {
            data: rows,
            meta: {
                total,
                page: parseInt(filters.page) || 1,
                limit: parseInt(filters.limit) || 20,
                totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
            }
        };
    }

    static async create(data) {
        const { id_secretaria, nombre, descripcion, unidad_base, es_activo } = data;
        const [result] = await pool.query(
            'INSERT INTO indicadores (id_secretaria, nombre, descripcion, unidad_base, es_activo) VALUES (?, ?, ?, ?, ?)',
            [id_secretaria, nombre, descripcion, unidad_base, es_activo]
        );
        return result.insertId;
    }

    static async update(id, data) {
        // Build dynamic update query
        const fields = [];
        const params = [];

        if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
        if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
        if (data.unidad_base !== undefined) { fields.push('unidad_base = ?'); params.push(data.unidad_base); }
        if (data.es_activo !== undefined) { fields.push('es_activo = ?'); params.push(data.es_activo); }
        if (data.id_secretaria !== undefined) { fields.push('id_secretaria = ?'); params.push(data.id_secretaria); }

        if (fields.length === 0) return false;

        params.push(id);

        await pool.query(`UPDATE indicadores SET ${fields.join(', ')} WHERE id_indicador = ?`, params);
        return true;
    }

    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT i.*, s.nombre as nombre_secretaria, 
                   GROUP_CONCAT(ip.tipo) as periodicidades_str
            FROM indicadores i
            LEFT JOIN secretarias s ON i.id_secretaria = s.id_secretaria
            LEFT JOIN indicador_periodicidades ip ON i.id_indicador = ip.id_indicador
            WHERE i.id_indicador = ?
            GROUP BY i.id_indicador
        `, [id]);

        if (rows.length > 0) {
            const row = rows[0];
            row.periodicidades = row.periodicidades_str ? row.periodicidades_str.split(',') : [];
            delete row.periodicidades_str;
            return row;
        }
        return null;
    }

    static async delete(id) {
        // Logical delete preferred usually, but user asked for CRUD. 
        // If "es_activo" exists, maybe just toggle it? 
        // User requirements: "es_activo TINYINT DEFAULT 1".
        // I'll support soft delete via update, but if DELETE is requested specifically...
        // Let's implement hard delete but it might fail due to foreign keys.
        // It's safer to rely on es_activo for "deleting" from UI perspective, 
        // but physically deleting might be needed for cleanup.
        // Given the complex relations (variables, records), hard delete is risky without cascading.
        // I will implement it, but controller should probably use update(es_active=0).
        await pool.query('DELETE FROM indicadores WHERE id_indicador = ?', [id]);
        return true;
    }
}

module.exports = IndicadoresDAO;
