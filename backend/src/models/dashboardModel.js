const DashboardDAO = require('../daos/dashboardDao');

class DashboardModel {
    static async getDashboardMetrics() {
        return await DashboardDAO.getMetrics();
    }
}

module.exports = DashboardModel;
