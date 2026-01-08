import api from './api';

const getAll = async (params = {}) => {
    const response = await api.get('/secretarias', { params });
    return response.data;
};

const create = async (data) => {
    const response = await api.post('/secretarias', data);
    return response.data;
};

const update = async (id, data) => {
    const response = await api.put(`/secretarias/${id}`, data);
    return response.data;
};

const remove = async (id) => {
    const response = await api.delete(`/secretarias/${id}`);
    return response.data;
};

const secretariasService = {
    getAll,
    create,
    update,
    remove,
};

export default secretariasService;
