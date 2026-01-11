import React from 'react';
import CompTableSelect from '../../../components/ui/CompTableSelect';
import secretariasService from '../../../services/secretariasService';

const TableSecretarias = ({ selectedSecretaria, onSecretariaChange }) => {

    const searchSecretarias = async (term) => {
        try {
            const response = await secretariasService.getAll({ q: term, limit: 20 });
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error("Error searching secretarias:", error);
            return [];
        }
    };

    return (
        <CompTableSelect
            label="Secretaría"
            selectedItem={selectedSecretaria}
            onSelect={onSecretariaChange}
            onSearch={searchSecretarias}
            itemDisplay={(s) => s.nombre}
            chars={1}
            placeholder="Buscar secretaría..."
        />
    );
};

export default TableSecretarias;
