const ZonaDepartamentoDAO = require('../daos/zonaDepartamentoDao');

class ZonasController {
    static async getAll(req, res) {
        try {
            const zonas = await ZonaDepartamentoDAO.getAll();
            res.json(zonas);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    }
}

module.exports = ZonasController;
