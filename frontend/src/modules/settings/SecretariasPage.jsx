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

    useEffect(() => {
        fetchSecretarias();
    }, []);

    const fetchSecretarias = async () => {
        setLoading(true);
        try {
            const data = await secretariasService.getAll();
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

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Secretarías</h2>
                <Button variant="primary" onClick={() => handleShow()}>
                    <FaPlus className="me-2" /> Nueva Secretaría
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="table-responsive shadow-sm rounded">
                <Table hover className="align-middle mb-0 bg-white">
                    <thead className="bg-light">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {secretarias.map((sec) => (
                            <tr key={sec.id_secretaria}>
                                <td>{sec.id_secretaria}</td>
                                <td>{sec.nombre}</td>
                                <td>
                                    <Badge bg={sec.es_activo ? 'success' : 'secondary'}>
                                        {sec.es_activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td className="text-end">
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShow(sec)}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sec.id_secretaria)}>
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

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
