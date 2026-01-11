import React, { useState } from 'react';
import CompTableSelect from '@/components/ui/CompTableSelect';
import municipiosService from '@/services/municipiosService';

const TableMunicipios = ({ selectedMunicipio, onMunicipioChange }) => {

    const searchMunicipios = async (term) => {
        try {
            const response = await municipiosService.getAll({ q: term, limit: 20 });
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error("Error searching municipios:", error);
            return [];
        }
    };

    return (
        <CompTableSelect
            label="Municipio"
            selectedItem={selectedMunicipio}
            onSelect={onMunicipioChange}
            onSearch={searchMunicipios}
            itemDisplay={(m) => `${m.codigo_municipio} - ${m.nombre}`}
            chars={1}
            placeholder="Buscar municipio..."
        />
    );
};

export default TableMunicipios;
