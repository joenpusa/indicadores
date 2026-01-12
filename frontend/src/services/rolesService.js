import api from './api';

const getAll = async (params = {}) => {
    const response = await api.get('/roles', { params });
    return response.data;
};

const create = async (data) => {
    const response = await api.post('/roles', data);
    return response.data;
};

const update = async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
};

const remove = async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
};

const rolesService = {
    getAll,
    create,
    update,
    remove,
};

export default rolesService;
