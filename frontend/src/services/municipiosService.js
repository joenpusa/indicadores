import api from './api';

const getAll = async (params = {}) => {
    const response = await api.get('/municipios', { params });
    return response.data;
};

const create = async (data) => {
    const response = await api.post('/municipios', data);
    return response.data;
};

const update = async (id, data) => {
    const response = await api.put(`/municipios/${id}`, data);
    return response.data;
};

const remove = async (id) => {
    // Optional, based on standard CRUD
    const response = await api.delete(`/municipios/${id}`);
    return response.data;
};

const municipiosService = {
    getAll,
    create,
    update,
    remove,
};

export default municipiosService;
