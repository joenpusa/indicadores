const GraficosDAO = require('../daos/graficosDao');

class GraficosModel {
    static async getConfigByIndicador(idIndicador) {
        if (!idIndicador) throw new Error('ID de indicadior es requerido');
        return await GraficosDAO.getByIndicador(idIndicador);
    }

    static async createConfig(data) {
        if (!data.id_indicador) throw new Error('ID de indicador es requerido');
        return await GraficosDAO.create(data);
    }

    static async updateConfig(id, data) {
        if (!id) throw new Error('ID es requerido');
        return await GraficosDAO.update(id, data);
    }

    static async updateConfigByIndicador(idIndicador, data) {
        if (!idIndicador) throw new Error('ID de indicador es requerido');
        // Check if config exists, if not create? Or assume it exists or handled by front?
        // DAO has updateByIndicador.
        const exists = await GraficosDAO.getByIndicador(idIndicador);
        if (exists) {
            return await GraficosDAO.updateByIndicador(idIndicador, data);
        } else {
            return await GraficosDAO.create({ ...data, id_indicador: idIndicador });
        }
    }
}

module.exports = GraficosModel;
