const SecretariasDAO = require('../daos/secretariasDao');

class SecretariasModel {
    static async getAllSecretarias() {
        return await SecretariasDAO.getAll();
    }

    static async createSecretaria(data) {
        if (!data.nombre) {
            throw new Error('El nombre es obligatorio');
        }
        return await SecretariasDAO.create(data);
    }

    static async updateSecretaria(id, data) {
        if (!id) throw new Error('ID es requerido');
        return await SecretariasDAO.update(id, data);
    }

    static async deleteSecretaria(id) {
        if (!id) throw new Error('ID es requerido');
        return await SecretariasDAO.delete(id);
    }

    static async getSecretariaById(id) {
        return await SecretariasDAO.getById(id);
    }
}

module.exports = SecretariasModel;
