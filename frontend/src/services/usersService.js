import api from './api';

const getAll = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
};

const create = async (data) => {
    const response = await api.post('/users', data);
    return response.data;
};

const update = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

const remove = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

const usersService = {
    getAll,
    create,
    update,
    remove,
};

export default usersService;
