const DashboardDAO = require('../daos/dashboardDao');

class DashboardModel {
    static async getDashboardMetrics() {
        return await DashboardDAO.getMetrics();
    }
    static async getPublicMetrics() {
        return await DashboardDAO.getPublicMetrics();
    }
}

module.exports = DashboardModel;
