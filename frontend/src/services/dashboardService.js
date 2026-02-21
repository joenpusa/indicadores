import api from './api';

const dashboardService = {
    getMetrics: async () => {
        const response = await api.get('/dashboard/metrics');
        return response.data;
    },
    getPublicMetrics: async () => {
        const response = await api.get('/dashboard/public-metrics');
        return response.data;
    }
};

export default dashboardService;
