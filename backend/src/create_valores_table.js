
const pool = require('./config/db');

async function createTable() {
    try {
        console.log('Creating indicador_valores table...');
        const sql = `
            CREATE TABLE IF NOT EXISTS indicador_valores (
              id_valor INT AUTO_INCREMENT PRIMARY KEY,
              id_registro INT NOT NULL,
              id_variable INT NOT NULL,
              valor TEXT,
              FOREIGN KEY (id_registro) REFERENCES indicador_registros(id_registro) ON DELETE CASCADE,
              FOREIGN KEY (id_variable) REFERENCES indicador_variables(id_variable)
            )
        `;
        await pool.query(sql);
        console.log('Table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

createTable();
