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

const getPublicMetrics = async (req, res) => {
    try {
        const metrics = await DashboardModel.getPublicMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error retrieving public dashboard metrics:', error);
        res.status(500).json({ error: true, message: 'Error retrieving public dashboard metrics' });
    }
};

module.exports = {
    getDashboardMetrics,
    getPublicMetrics
};
