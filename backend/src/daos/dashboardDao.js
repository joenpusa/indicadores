const pool = require('../config/db');

class DashboardDAO {
    static async getMetrics() {
        try {
            // Quantity of active secretarias
            const [secretariasResult] = await pool.query('SELECT COUNT(*) as total FROM secretarias WHERE es_activo = 1');
            const totalSecretarias = secretariasResult[0].total;

            // Total quantity of users
            const [usersResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE es_activo = 1');
            const totalUsers = usersResult[0].total;

            // Quantity of indicadores per secretaria
            const [indicadoresResult] = await pool.query(`
                SELECT s.nombre as secretaria, COUNT(i.id_indicador) as total_indicadores
                FROM secretarias s
                LEFT JOIN indicadores i ON s.id_secretaria = i.id_secretaria AND i.es_activo = 1
                WHERE s.es_activo = 1
                GROUP BY s.id_secretaria, s.nombre
                ORDER BY total_indicadores DESC
            `);

            // Total quantity of indicadores
            const [totalIndicadoresResult] = await pool.query('SELECT COUNT(*) as total FROM indicadores WHERE es_activo = 1');
            const totalIndicadoresList = totalIndicadoresResult[0].total;

            return {
                totalSecretariasActivas: totalSecretarias,
                totalUsuarios: totalUsers,
                totalIndicadores: totalIndicadoresList,
                indicadoresPorSecretaria: indicadoresResult
            };
        } catch (error) {
            console.error('Error in DashboardDAO getMetrics:', error);
            throw error;
        }
    }
    static async getPublicMetrics() {
        try {
            const [municipios] = await pool.query('SELECT COUNT(*) as total FROM municipios WHERE activo = 1');
            const [secretarias] = await pool.query('SELECT COUNT(*) as total FROM secretarias WHERE es_activo = 1');
            const [variables] = await pool.query('SELECT COUNT(*) as total FROM indicador_variables');
            const [indicadores] = await pool.query('SELECT COUNT(*) as total FROM indicadores WHERE es_activo = 1');

            return {
                totalMunicipios: municipios[0].total,
                totalSecretarias: secretarias[0].total,
                totalVariables: variables[0].total,
                totalIndicadores: indicadores[0].total
            };
        } catch (error) {
            console.error('Error in DashboardDAO getPublicMetrics:', error);
            throw error;
        }
    }
}

module.exports = DashboardDAO;
