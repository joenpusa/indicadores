const VariablesDAO = require('../daos/variablesDao');

class VariablesModel {
    static async getVariablesByIndicador(idIndicador) {
        if (!idIndicador) throw new Error('ID de indicadior es requerido');
        return await VariablesDAO.getByIndicador(idIndicador);
    }

    static async createVariable(data) {
        if (!data.id_indicador) throw new Error('El ID del indicador es obligatorio');
        if (!data.nombre) throw new Error('El nombre de la variable es obligatorio');
        if (!data.tipo) throw new Error('El tipo de variable es obligatorio');

        return await VariablesDAO.create(data);
    }

    static async updateVariable(id, data) {
        if (!id) throw new Error('ID es requerido');
        return await VariablesDAO.update(id, data);
    }

    static async deleteVariable(id) {
        if (!id) throw new Error('ID es requerido');
        return await VariablesDAO.delete(id);
    }
}

module.exports = VariablesModel;
