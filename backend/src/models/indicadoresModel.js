const IndicadoresDAO = require('../daos/indicadoresDao');

class IndicadoresModel {
    static async getAllIndicadores(filters) {
        return await IndicadoresDAO.getAll(filters);
    }

    static async createIndicador(data) {
        if (!data.nombre) throw new Error('El nombre del indicador es obligatorio');
        if (!data.id_secretaria) throw new Error('La secretaría es obligatoria');
        if (!data.periodicidad) throw new Error('La periodicidad es obligatoria');

        return await IndicadoresDAO.create(data);
    }

    static async updateIndicador(id, data) {
        if (!id) throw new Error('ID es requerido');
        return await IndicadoresDAO.update(id, data);
    }

    static async getIndicadorById(id) {
        if (!id) throw new Error('ID es requerido');
        return await IndicadoresDAO.getById(id);
    }

    static async deleteIndicador(id) {
        if (!id) throw new Error('ID es requerido');
        return await IndicadoresDAO.delete(id);
    }
}

module.exports = IndicadoresModel;
