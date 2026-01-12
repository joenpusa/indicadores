import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import usersService from '@/services/usersService';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import TableSecretarias from '@/modules/settings/secretarias/TableSecretarias';
import TableRoles from '@/modules/settings/roles/TableRoles';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const intentToFetchRef = useRef(false);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        nombre: '',
        rol_id: '',
        id_secretaria: '',
        password: '',
        es_activo: true
    });
    // State for the selected objects (for display in Table components)
    const [selectedRol, setSelectedRol] = useState(null);
    const [selectedSecretaria, setSelectedSecretaria] = useState(null);

    const [formError, setFormError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { success, error } = useToast();
    const { confirm } = useConfirm();

    const fetchUsers = async (pageNum = 1, shouldReset = false) => {
        if (isFetching && !shouldReset) return;
        if (shouldReset) setLoading(true);
        else setIsFetching(true);

        try {
            const response = await usersService.getAll({ q: searchTerm, page: pageNum, limit: 20 });
            const newUsers = response.data || [];
            setUsers(prev => shouldReset ? newUsers : [...prev, ...newUsers]);
            setHasMore(pageNum < (response.meta?.totalPages || 1));
        } catch (err) {
            error('Error al cargar usuarios.');
            console.error(err);
        } finally {
            setLoading(false);
            setIsFetching(false);
            intentToFetchRef.current = false;
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            intentToFetchRef.current = false;
            setPage(1);
            fetchUsers(1, true);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (page > 1) fetchUsers(page, false);
    }, [page]);

    useEffect(() => {
        const scrollContainer = document.getElementById('main-content');
        if (!scrollContainer) return;
        const handleScroll = () => {
            if (
                scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight * 0.8 &&
                hasMore && !isFetching && !loading && !intentToFetchRef.current
            ) {
                intentToFetchRef.current = true;
                setPage(prev => prev + 1);
            }
        };
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetching, loading]);

    const handleShow = (user = null) => {
        if (user) {
            setEditingId(user.id_usuario);
            setFormData({
                email: user.email,
                nombre: user.nombre,
                rol_id: user.rol_id,
                id_secretaria: user.id_secretaria,
                password: '', // Password empty on edit
                es_activo: !!user.es_activo
            });
            // Construct pseudo-objects for the Table Selectors to show the current value
            setSelectedRol(user.rol_id ? { rol_id: user.rol_id, nombre_rol: user.nombre_rol } : null);
            setSelectedSecretaria(user.id_secretaria ? { id_secretaria: user.id_secretaria, nombre: user.nombre_secretaria } : null);
        } else {
            setEditingId(null);
            setFormData({
                email: '',
                nombre: '',
                rol_id: '',
                id_secretaria: '',
                password: '',
                es_activo: true
            });
            setSelectedRol(null);
            setSelectedSecretaria(null);
        }
        setFormError(null);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        // Basic validation
        if (!formData.email || !formData.nombre || !formData.rol_id) {
            setFormError('Email, Nombre y Rol son obligatorios.');
            return;
        }
        if (!editingId && !formData.password) {
            setFormError('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }

        try {
            if (editingId) {
                await usersService.update(editingId, formData);
                success('Usuario actualizado correctamente.');
            } else {
                await usersService.create(formData);
                success('Usuario creado correctamente.');
            }
            fetchUsers(1, true);
            handleClose();
        } catch (err) {
            error(err.response?.data?.message || 'Error al guardar usuario.');
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Desactivar Usuario',
            message: '¿Estás seguro de que deseas desactivar este usuario?',
            confirmText: 'Desactivar',
            variant: 'danger'
        });

        if (isConfirmed) {
            try {
                await usersService.remove(id);
                success('Usuario desactivado.');
                fetchUsers(1, true);
            } catch (err) {
                error('Error al desactivar usuario.');
            }
        }
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Gestión de Usuarios</h2>
                <Button variant="primary" onClick={() => handleShow()}>
                    <FaPlus className="me-2" /> Nuevo Usuario
                </Button>
            </div>

            <div className="mb-4">
                <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow-sm"
                />
            </div>

            {loading ? (
                <div className="text-center mt-5"><Spinner animation="border" /></div>
            ) : (
                <div className="row g-3">
                    {users.map((user) => (
                        <div className="col-12 col-md-6 col-lg-4" key={user.id_usuario}>
                            <div className={`card shadow-sm border-0 h-100 ${!user.es_activo ? 'opacity-75 bg-light' : ''}`}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                                                <FaUser size={24} />
                                            </div>
                                            <div>
                                                <h5 className="card-title mb-1">{user.nombre}</h5>
                                                <p className="card-subtitle text-muted small">{user.email}</p>
                                            </div>
                                        </div>
                                        <Badge bg={user.es_activo ? 'success' : 'secondary'}>
                                            {user.es_activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                    <div className="mb-3">
                                        <small className="d-block text-muted">Rol: <span className="text-dark fw-medium">{user.nombre_rol}</span></small>
                                        <small className="d-block text-muted">Secretaría: <span className="text-dark fw-medium">{user.nombre_secretaria || 'N/A'}</span></small>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <Button variant="outline-primary" size="sm" onClick={() => handleShow(user)} title="Editar">
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(user.id_usuario)} title="Desactivar" disabled={!user.es_activo}>
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <Alert variant="danger">{formError}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <Form.Control
                                        type="text"
                                        id="floatingNombre"
                                        placeholder="Nombre completo"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className={formError && !formData.nombre ? 'is-invalid' : ''}
                                    />
                                    <label htmlFor="floatingNombre">Nombre <span className="text-danger">*</span></label>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <Form.Control
                                        type="email"
                                        id="floatingEmail"
                                        placeholder="correo@ejemplo.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={formError && !formData.email ? 'is-invalid' : ''}
                                    />
                                    <label htmlFor="floatingEmail">Email <span className="text-danger">*</span></label>
                                </div>
                            </div>
                        </div>

                        <div className="row g-2">
                            <div className="col-md-6 mb-3">
                                <TableRoles
                                    selectedRol={selectedRol}
                                    onRolChange={(rol) => {
                                        setSelectedRol(rol);
                                        setFormData({ ...formData, rol_id: rol ? rol.rol_id : '' });
                                    }}
                                />
                                {formError && !formData.rol_id && <div className="text-danger small mt-1">El rol es requerido</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                                <TableSecretarias
                                    selectedSecretaria={selectedSecretaria}
                                    onSecretariaChange={(sec) => {
                                        setSelectedSecretaria(sec);
                                        setFormData({ ...formData, id_secretaria: sec ? sec.id_secretaria : '' });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-floating mb-3">
                            <Form.Control
                                type="password"
                                id="floatingPassword"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={formError && !editingId && !formData.password ? 'is-invalid' : ''}
                            />
                            <label htmlFor="floatingPassword">
                                {editingId ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
                                {!editingId && <span className="text-danger">*</span>}
                            </label>
                        </div>

                        <div className="mb-3">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Usuario Activo"
                                checked={formData.es_activo}
                                onChange={(e) => setFormData({ ...formData, es_activo: e.target.checked })}
                            />
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                            <Button variant="primary" type="submit">{editingId ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UsersPage;
