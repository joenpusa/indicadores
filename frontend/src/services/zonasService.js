import api from './api';

const getAll = async () => {
    const response = await api.get('/zonas');
    return response.data;
};

const zonasService = {
    getAll,
};

export default zonasService;
