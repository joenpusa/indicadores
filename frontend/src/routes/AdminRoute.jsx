import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert, Button } from 'react-bootstrap';

const AdminRoute = () => {
    const { user } = useAuth();
    const isAdmin = user && (user.rol_id === 1 || user.role === 1);

    if (!isAdmin) {
        return (
            <div className="container-fluid mt-4">
                <Alert variant="danger" className="p-4 text-center shadow-sm">
                    <h4 className="alert-heading">Acceso Restringido</h4>
                    <p>No tiene permisos para acceder a este módulo. Esta sección está reservada exclusivamente para administradores del sistema.</p>
                    <hr />
                    <Button variant="outline-danger" href="/dashboard">
                        Volver al Dashboard
                    </Button>
                </Alert>
            </div>
        );
    }

    return <Outlet />;
};

export default AdminRoute;
