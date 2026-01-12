const UsersModel = require('../models/usersModel');

class UsersController {
    static async getAll(req, res) {
        try {
            const { page, limit, q, active } = req.query;
            const result = await UsersModel.getAllUsers({ page, limit, q, active });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const id = await UsersModel.createUser(req.body);
            res.status(201).json({ message: 'Usuario creado', id });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            await UsersModel.updateUser(id, req.body);
            res.json({ message: 'Usuario actualizado' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            await UsersModel.deleteUser(id);
            res.json({ message: 'Usuario desactivado' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await UsersModel.getUserById(id);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = UsersController;
