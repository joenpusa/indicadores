import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';
import rolesService from '@/services/rolesService';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const intentToFetchRef = useRef(false);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre_rol: '' });
    const [formError, setFormError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const { success, error } = useToast();
    const { confirm } = useConfirm();

    // Fetch data logic
    const fetchRoles = async (pageNum = 1, shouldReset = false) => {
        if (isFetching && !shouldReset) return;

        if (shouldReset) {
            setLoading(true);
        } else {
            setIsFetching(true);
        }

        try {
            const response = await rolesService.getAll({ q: searchTerm, page: pageNum, limit: 20 });
            const newRoles = response.data || [];

            setRoles(prev => shouldReset ? newRoles : [...prev, ...newRoles]);
            setHasMore(pageNum < (response.meta?.totalPages || 1));
        } catch (err) {
            error('Error al cargar los roles.');
            console.error(err);
        } finally {
            setLoading(false);
            setIsFetching(false);
            intentToFetchRef.current = false;
        }
    };

    // Effect for handling search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            intentToFetchRef.current = false;
            setPage(1);
            fetchRoles(1, true);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Effect for handling page changes
    useEffect(() => {
        if (page > 1) {
            fetchRoles(page, false);
        }
    }, [page]);

    // Scroll listener
    useEffect(() => {
        const scrollContainer = document.getElementById('main-content');
        if (!scrollContainer) return;

        const handleScroll = () => {
            if (
                scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight * 0.8 &&
                hasMore &&
                !isFetching &&
                !loading &&
                !intentToFetchRef.current
            ) {
                intentToFetchRef.current = true;
                setPage(prev => prev + 1);
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetching, loading]);

    const handleShow = (rol = null) => {
        if (rol) {
            setEditingId(rol.rol_id);
            setFormData({ nombre_rol: rol.nombre_rol });
        } else {
            setEditingId(null);
            setFormData({ nombre_rol: '' });
        }
        setFormError(null);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.nombre_rol.trim()) {
            setFormError('El nombre del rol es obligatorio.');
            return;
        }

        try {
            if (editingId) {
                await rolesService.update(editingId, formData);
                success('Rol actualizado correctamente.');
            } else {
                await rolesService.create(formData);
                success('Rol creado correctamente.');
            }
            fetchRoles(1, true);
            handleClose();
        } catch (err) {
            error('Error al guardar el rol.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Eliminar Rol',
            message: '¿Estás seguro de que deseas eliminar este rol permanentemente?',
            confirmText: 'Eliminar',
            variant: 'danger'
        });

        if (isConfirmed) {
            try {
                await rolesService.remove(id);
                success('Rol eliminado correctamente.');
                fetchRoles(1, true);
            } catch (err) {
                error('Error al eliminar el rol.');
                console.error(err);
            }
        }
    };

    return (
        <div className="container-fluid">
            <style>
                {`
                    .role-card {
                        transition: all 0.3s ease;
                        border-left: 5px solid #ffc107;
                    }
                    .role-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                        background-color: #f8f9fa;
                    }
                `}
            </style>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Gestión de Roles</h2>
                <Button variant="primary" onClick={() => handleShow()}>
                    <FaPlus className="me-2" /> Nuevo Rol
                </Button>
            </div>

            <div className="mb-4">
                <Form.Control
                    type="text"
                    placeholder="Buscar rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow-sm"
                />
            </div>

            {loading ? (
                <div className="text-center mt-5"><Spinner animation="border" /></div>
            ) : (
                <div className="row g-3">
                    {roles.map((rol) => (
                        <div className="col-12 col-md-6 col-lg-6" key={rol.rol_id}>
                            <div className="card shadow-sm border-0 role-card h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-light p-3 rounded-circle text-warning">
                                            <FaUserShield size={24} />
                                        </div>
                                        <h5 className="card-title mb-0">{rol.nombre_rol}</h5>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleShow(rol)}
                                            title="Editar"
                                            disabled={rol.rol_id === 1}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(rol.rol_id)}
                                            title="Eliminar"
                                            disabled={rol.rol_id === 1}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Create/Edit */}
            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Editar Rol' : 'Nuevo Rol'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <Alert variant="danger">{formError}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <div className="form-floating mb-3">
                            <Form.Control
                                type="text"
                                id="floatingNombreRol"
                                placeholder="Nombre del Rol"
                                value={formData.nombre_rol}
                                onChange={(e) => setFormData({ ...formData, nombre_rol: e.target.value })}
                                autoFocus
                                className={formError ? 'is-invalid' : ''}
                            />
                            <label htmlFor="floatingNombreRol">
                                Nombre del Rol <span className="text-danger">*</span>
                            </label>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingId ? 'Guardar Cambios' : 'Crear Rol'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default RolesPage;
