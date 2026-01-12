const UsersDAO = require('../daos/usersDao');

class UsersModel {
    static async getAllUsers(filters) {
        return await UsersDAO.getAll(filters);
    }

    static async createUser(data) {
        if (!data.email || !data.nombre || !data.rol_id || !data.password) {
            throw new Error('Email, nombre, rol y contraseña son obligatorios');
        }
        if (!data.id_secretaria) {
            data.id_secretaria = null;
        }
        return await UsersDAO.create(data);
    }

    static async updateUser(id, data) {
        if (!id) throw new Error('ID es requerido');
        if (!data.id_secretaria) {
            data.id_secretaria = null;
        }
        return await UsersDAO.update(id, data);
    }

    static async deleteUser(id) {
        if (!id) throw new Error('ID es requerido');
        return await UsersDAO.delete(id);
    }

    static async getUserById(id) {
        return await UsersDAO.getById(id);
    }
}

module.exports = UsersModel;
