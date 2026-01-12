const RolesDAO = require('../daos/rolesDao');

class RolesModel {
    static async getAllRoles(filters) {
        return await RolesDAO.getAll(filters);
    }

    static async createRol(data) {
        if (!data.nombre_rol) {
            throw new Error('El nombre del rol es obligatorio');
        }
        return await RolesDAO.create(data);
    }

    static async updateRol(id, data) {
        if (!id) throw new Error('ID es requerido');
        if (parseInt(id) === 1) throw new Error('El rol de Administrador no se puede modificar');
        return await RolesDAO.update(id, data);
    }

    static async deleteRol(id) {
        if (!id) throw new Error('ID es requerido');
        if (parseInt(id) === 1) throw new Error('El rol de Administrador no se puede eliminar');
        return await RolesDAO.delete(id);
    }

    static async getRolById(id) {
        return await RolesDAO.getById(id);
    }
}

module.exports = RolesModel;
