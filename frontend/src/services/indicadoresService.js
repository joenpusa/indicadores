import api from './api';

const getAll = async (params = {}) => {
    const response = await api.get('/indicadores', { params });
    return response.data;
};

const getById = async (id) => {
    const response = await api.get(`/indicadores/${id}`);
    return response.data;
};

const create = async (data) => {
    const response = await api.post('/indicadores', data);
    return response.data;
};

const update = async (id, data) => {
    const response = await api.put(`/indicadores/${id}`, data);
    return response.data;
};

// Variables
const getVariables = async (idIndicador) => {
    const response = await api.get(`/indicadores/${idIndicador}/variables`);
    return response.data;
};

const createVariable = async (idIndicador, data) => {
    const response = await api.post(`/indicadores/${idIndicador}/variables`, data);
    return response.data;
};

const updateVariable = async (idVariable, data) => {
    const response = await api.put(`/indicadores/variables/${idVariable}`, data);
    return response.data;
};

const deleteVariable = async (idVariable) => {
    const response = await api.delete(`/indicadores/variables/${idVariable}`);
    return response.data;
};

// Configuración
const getConfig = async (idIndicador) => {
    const response = await api.get(`/indicadores/${idIndicador}/visualizacion`);
    return response.data;
};

const saveConfig = async (id, config) => {
    const response = await api.post(`/indicadores/${id}/visualizacion`, config);
    return response.data;
};

// Data Loading
const downloadTemplate = async (id) => {
    const response = await api.get(`/indicadores/${id}/plantilla`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_carga.xlsx'); // Filename might be overridden by header
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const uploadData = async (id, data, isFile = false) => {
    const config = isFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post(`/indicadores/${id}/carga`, data, config);
    return response.data;
};

const getRegistros = async (id, idPeriodo) => {
    const params = idPeriodo ? { id_periodo: idPeriodo } : {};
    const response = await api.get(`/indicadores/${id}/registros`, { params });
    return response.data;
};

const deleteRegistro = async (id, idRegistro) => {
    const response = await api.delete(`/indicadores/${id}/registros/${idRegistro}`);
    return response.data;
};

// Periodos
const getPeriodos = async () => {
    const response = await api.get('/indicadores/periodos/all');
    return response.data;
};

const createRegistro = async (id, data) => {
    return uploadData(id, data, false);
};

const indicadoresService = {
    getAll,
    getById,
    create,
    update,
    getVariables,
    createVariable,
    updateVariable,
    deleteVariable,
    getConfig,
    saveConfig,
    getPeriodos,
    // Data Loading
    downloadTemplate,
    uploadData,
    uploadData,
    createRegistro,
    getRegistros,
    deleteRegistro
};

export default indicadoresService;
