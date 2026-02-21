const DashboardModel = require('../models/dashboardModel');

const getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await DashboardModel.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error retrieving dashboard metrics:', error);
        res.status(500).json({ error: true, message: 'Error retrieving dashboard metrics' });
    }
};

module.exports = {
    getDashboardMetrics
};
