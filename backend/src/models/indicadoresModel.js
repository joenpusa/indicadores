const IndicadoresDAO = require('../daos/indicadoresDao');
const IndicadorPeriodicidadesDAO = require('../daos/indicadorPeriodicidadesDao');

class IndicadoresModel {
    static async getAllIndicadores(filters) {
        return await IndicadoresDAO.getAll(filters);
    }

    static async createIndicador(data) {
        if (!data.nombre) throw new Error('El nombre del indicador es obligatorio');
        if (!data.id_secretaria) throw new Error('La secretaría es obligatoria');

        const idIndicador = await IndicadoresDAO.create(data);

        if (data.periodicidades && Array.isArray(data.periodicidades)) {
            for (const tipo of data.periodicidades) {
                await IndicadorPeriodicidadesDAO.create(idIndicador, tipo);
            }
        }

        return idIndicador;
    }

    static async updateIndicador(id, data) {
        if (!id) throw new Error('ID es requerido');
        await IndicadoresDAO.update(id, data);

        if (data.periodicidades && Array.isArray(data.periodicidades)) {
            await IndicadorPeriodicidadesDAO.deleteAll(id);
            for (const tipo of data.periodicidades) {
                await IndicadorPeriodicidadesDAO.create(id, tipo);
            }
        }

        return true;
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
