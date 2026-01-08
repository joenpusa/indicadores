import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, OverlayTrigger, Tooltip, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle } from 'react-icons/fa';
import secretariasService from '../../services/secretariasService';

const SecretariasPage = () => {
    const [secretarias, setSecretarias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', es_activo: true });
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSecretarias();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchSecretarias = async () => {
        setLoading(true);
        try {
            const data = await secretariasService.getAll({ q: searchTerm });
            setSecretarias(data);
        } catch (err) {
            setError('Error al cargar las secretarías.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShow = (secretaria = null) => {
        if (secretaria) {
            setEditingId(secretaria.id_secretaria);
            setFormData({ nombre: secretaria.nombre, es_activo: secretaria.es_activo === 1 });
        } else {
            setEditingId(null);
            setFormData({ nombre: '', es_activo: true });
        }
        setFormError(null);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }

        try {
            const dataToSend = { ...formData, es_activo: formData.es_activo ? 1 : 0 };
            if (editingId) {
                await secretariasService.update(editingId, dataToSend);
            } else {
                await secretariasService.create(dataToSend);
            }
            fetchSecretarias();
            handleClose();
        } catch (err) {
            setFormError('Error al guardar la secretaría.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas desactivar esta secretaría?')) {
            try {
                await secretariasService.remove(id);
                fetchSecretarias();
            } catch (err) {
                setError('Error al eliminar la secretaría.');
                console.error(err);
            }
        }
    };

    return (
        <div className="container-fluid">
            <style>
                {`
                    .secretaria-card {
                        transition: all 0.3s ease;
                        border-left: 5px solid #6c757d;
                    }
                    .secretaria-card.active {
                        border-left-color: #198754;
                    }
                    .secretaria-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                        background-color: #f8f9fa;
                    }
                `}
            </style>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Gestión de Secretarías</h2>
                <Button variant="primary" onClick={() => handleShow()}>
                    <FaPlus className="me-2" /> Nueva Secretaría
                </Button>
            </div>

            <div className="mb-4">
                <Form.Control
                    type="text"
                    placeholder="Buscar secretaría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow-sm"
                />
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center mt-5"><Spinner animation="border" /></div>
            ) : (
                <div className="row g-3">
                    {secretarias.map((sec) => (
                        <div className="col-12" key={sec.id_secretaria}>
                            <div className={`card shadow-sm border-0 secretaria-card ${sec.es_activo ? 'active' : ''}`}>
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div className="d-flex flex-column">
                                        <h5 className="card-title mb-1">{sec.nombre}</h5>
                                        <div>
                                            <Badge bg={sec.es_activo ? 'success' : 'secondary'} className="fw-normal">
                                                {sec.es_activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-primary" size="sm" onClick={() => handleShow(sec)} title="Editar">
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sec.id_secretaria)} title="Eliminar">
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
                    <Modal.Title>{editingId ? 'Editar Secretaría' : 'Nueva Secretaría'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <Alert variant="danger">{formError}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Nombre <span className="text-danger">*</span>
                                <OverlayTrigger
                                    placement="right"
                                    overlay={<Tooltip>Nombre oficial de la secretaría.</Tooltip>}
                                >
                                    <span className="ms-2 text-muted"><FaQuestionCircle /></span>
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej: Secretaría de Salud"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Activo"
                                checked={formData.es_activo}
                                onChange={(e) => setFormData({ ...formData, es_activo: e.target.checked })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingId ? 'Guardar Cambios' : 'Crear Secretaría'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SecretariasPage;
