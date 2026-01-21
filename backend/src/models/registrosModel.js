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

        // 1. Get Records
        const registros = await RegistrosDAO.getByIndicadorAndPeriodo(idIndicador, idPeriodo);
        if (registros.length === 0) return [];

        // 2. Get Values
        const ids = registros.map(r => r.id_registro);
        const ValoresDAO = require('../daos/valoresDao'); // Lazy load avoids circular dep if any
        const allValues = await ValoresDAO.getByRegistros(ids);

        // 3. Map values to records
        // output: [{ ...registro, valores: { [id_variable]: valor } }]
        const regsWithValues = registros.map(reg => {
            const regVals = allValues.filter(v => v.id_registro === reg.id_registro);
            const valoresObj = {};
            regVals.forEach(v => {
                valoresObj[v.id_variable] = v.valor;
            });
            return { ...reg, valores: valoresObj };
        });

        return regsWithValues;
    }
}

module.exports = RegistrosModel;
