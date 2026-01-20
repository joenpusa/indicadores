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
}

module.exports = PeriodosModel;
