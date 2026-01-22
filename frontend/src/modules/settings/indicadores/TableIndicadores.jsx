import React from 'react';
import CompTableSelect from '@/components/ui/CompTableSelect';
import indicadoresService from '@/services/indicadoresService';

const TableIndicadores = ({ selectedIndicador, onIndicadorChange, onlyActive = false }) => {

    const searchIndicadores = async (term) => {
        try {
            const params = { q: term, limit: 20 };
            if (onlyActive) {
                params.active = 1;
            }
            const response = await indicadoresService.getAll(params);
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error("Error searching indicadores:", error);
            return [];
        }
    };

    return (
        <CompTableSelect
            label="Indicador"
            selectedItem={selectedIndicador}
            onSelect={onIndicadorChange}
            onSearch={searchIndicadores}
            itemDisplay={(i) => i.nombre}
            chars={1}
            placeholder="Buscar indicador..."
        />
    );
};

export default TableIndicadores;
