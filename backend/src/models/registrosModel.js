const RegistrosDAO = require('../daos/registrosDao');

class RegistrosModel {
    static async createRegistro(data) {
        if (!data.id_indicador || !data.id_municipio || !data.id_periodo) {
            throw new Error('Datos incompletos para el registro');
        }
        return await RegistrosDAO.create(data);
    }

    static async getRegistros(idIndicador, idPeriodo) {
        if (!idIndicador) throw new Error('ID de indicador requerido');
        if (!idPeriodo) throw new Error('ID de periodo requerido');
        return await RegistrosDAO.getByIndicadorAndPeriodo(idIndicador, idPeriodo);
    }
}

module.exports = RegistrosModel;
