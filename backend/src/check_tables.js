
const pool = require('./config/db');

async function checkTables() {
    try {
        console.log('Checking tables...');
        const [tables] = await pool.query("SHOW TABLES");
        console.log('Tables in DB:', tables.map(t => Object.values(t)[0]));

        try {
            const [desc] = await pool.query("DESCRIBE indicador_registros");
            console.log('indicador_registros schema:', desc.map(c => c.Field));
        } catch (e) {
            console.log('indicador_registros does not exist');
        }

        try {
            const [descVal] = await pool.query("DESCRIBE indicador_valores");
            console.log('indicador_valores schema:', descVal.map(c => c.Field));
        } catch (e) {
            console.log('indicador_valores does not exist');
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkTables();
