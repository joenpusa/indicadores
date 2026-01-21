const PeriodosDAO = require('../daos/periodosDao');

class PeriodosModel {
    static async getAllPeriodos() {
        return await PeriodosDAO.getAll();
    }

    static async getPeriodosByAnio(anio) {
        if (!anio) throw new Error('Año es requerido');
        return await PeriodosDAO.getByAnio(anio);
    }

    static async getById(id) {
        return await PeriodosDAO.getById(id);
    }

    static async createPeriodo(data) {
        if (!data.tipo || !data.anio || !data.fecha_inicio || !data.fecha_fin) {
            throw new Error('Faltan datos obligatorios para el periodo');
        }
        return await PeriodosDAO.create(data);
    }

    static async findOrCreate(tipo, anio, numero) {
        if (!tipo || !anio) throw new Error('Tipo y Año son requeridos');

        // Check if exists
        const existing = await PeriodosDAO.getByParams(tipo, anio, numero);
        if (existing) return existing.id_periodo;

        // Calculate dates
        let fecha_inicio, fecha_fin;
        const anioInt = parseInt(anio);
        const numeroInt = numero ? parseInt(numero) : null;

        if (tipo === 'anual') {
            fecha_inicio = `${anioInt}-01-01`;
            fecha_fin = `${anioInt}-12-31`;
        } else if (tipo === 'semestral') {
            if (numeroInt === 1) {
                fecha_inicio = `${anioInt}-01-01`;
                fecha_fin = `${anioInt}-06-30`;
            } else if (numeroInt === 2) {
                fecha_inicio = `${anioInt}-07-01`;
                fecha_fin = `${anioInt}-12-31`;
            }
        } else if (tipo === 'trimestral') {
            if (numeroInt === 1) {
                fecha_inicio = `${anioInt}-01-01`;
                fecha_fin = `${anioInt}-03-31`;
            } else if (numeroInt === 2) {
                fecha_inicio = `${anioInt}-04-01`;
                fecha_fin = `${anioInt}-06-30`;
            } else if (numeroInt === 3) {
                fecha_inicio = `${anioInt}-07-01`;
                fecha_fin = `${anioInt}-09-30`;
            } else if (numeroInt === 4) {
                fecha_inicio = `${anioInt}-10-01`;
                fecha_fin = `${anioInt}-12-31`;
            }
        } else if (tipo === 'mensual') {
            // numero 1-12
            const start = new Date(anioInt, numeroInt - 1, 1);
            const end = new Date(anioInt, numeroInt, 0); // Last day of month
            // Format YYYY-MM-DD
            const fmt = d => d.toISOString().split('T')[0];
            fecha_inicio = fmt(start);
            fecha_fin = fmt(end);
        }

        if (!fecha_inicio || !fecha_fin) {
            throw new Error(`No se pudo calcular fechas para ${tipo} ${anio} ${numero}`);
        }

        return await PeriodosDAO.create({
            tipo,
            anio: anioInt,
            numero: numeroInt,
            fecha_inicio,
            fecha_fin
        });
    }
}

module.exports = PeriodosModel;
