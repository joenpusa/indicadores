const SecretariasModel = require('../models/secretariasModel');

class SecretariasController {
    static async getAll(req, res) {
        try {
            const secretarias = await SecretariasModel.getAllSecretarias();
            res.json(secretarias);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const id = await SecretariasModel.createSecretaria(req.body);
            res.status(201).json({ message: 'Secretaria creada', id });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            await SecretariasModel.updateSecretaria(id, req.body);
            res.json({ message: 'Secretaria actualizada' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            await SecretariasModel.deleteSecretaria(id);
            res.json({ message: 'Secretaria eliminada' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = SecretariasController;
