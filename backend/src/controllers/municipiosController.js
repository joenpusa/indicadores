const MunicipiosDAO = require('../daos/municipiosDao');

class MunicipiosController {
    static async getAll(req, res) {
        try {
            const { page, limit, q, active } = req.query;
            const result = await MunicipiosDAO.getAll({ page, limit, q, active });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { codigo_municipio, nombre, id_zona, activo } = req.body;

            // Validations
            if (!codigo_municipio) return res.status(400).json({ error: true, message: 'El código del municipio es obligatorio' });
            if (!nombre) return res.status(400).json({ error: true, message: 'El nombre es obligatorio' });
            if (!id_zona) return res.status(400).json({ error: true, message: 'La zona es obligatoria' });

            const id = await MunicipiosDAO.create({ codigo_municipio, nombre, id_zona, activo });
            res.status(201).json({ message: 'Municipio creado', id });
        } catch (error) {
            // Check for duplicate entry error logic if needed, but generic 500 is ok for now unless specific requirement.
            res.status(500).json({ error: true, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { codigo_municipio, nombre, id_zona, activo } = req.body;

            // Validations
            if (!id) return res.status(400).json({ error: true, message: 'ID es requerido' });
            if (!codigo_municipio) return res.status(400).json({ error: true, message: 'El código del municipio es obligatorio' });
            if (!nombre) return res.status(400).json({ error: true, message: 'El nombre es obligatorio' });
            if (!id_zona) return res.status(400).json({ error: true, message: 'La zona es obligatoria' });

            await MunicipiosDAO.update(id, { codigo_municipio, nombre, id_zona, activo });
            res.json({ message: 'Municipio actualizado' });
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = MunicipiosController;
