const RolesModel = require('../models/rolesModel');

class RolesController {
    static async getAll(req, res) {
        try {
            const { page, limit, q } = req.query;
            const result = await RolesModel.getAllRoles({ page, limit, q });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const id = await RolesModel.createRol(req.body);
            res.status(201).json({ message: 'Rol creado', id });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            await RolesModel.updateRol(id, req.body);
            res.json({ message: 'Rol actualizado' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            await RolesModel.deleteRol(id);
            res.json({ message: 'Rol eliminado' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = RolesController;
