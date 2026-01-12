import React from 'react';
import CompTableSelect from '@/components/ui/CompTableSelect';
import rolesService from '@/services/rolesService';

const TableRoles = ({ selectedRol, onRolChange }) => {

    const searchRoles = async (term) => {
        try {
            const response = await rolesService.getAll({ q: term, limit: 20 });
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error("Error searching roles:", error);
            return [];
        }
    };

    return (
        <CompTableSelect
            label="Rol"
            selectedItem={selectedRol}
            onSelect={onRolChange}
            onSearch={searchRoles}
            itemDisplay={(r) => r.nombre_rol}
            chars={1}
            placeholder="Buscar rol..."
        />
    );
};

export default TableRoles;
