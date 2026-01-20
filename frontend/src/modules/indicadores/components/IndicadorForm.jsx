import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, FloatingLabel, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import indicadoresService from '../../../services/indicadoresService';
import TableSecretarias from '../../settings/secretarias/TableSecretarias';

const IndicadorForm = ({ show, indicador, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        id_secretaria: '',
        descripcion: '',
        unidad_base: '',
        es_activo: true,
        periodicidades: []
    });
    // Store selected object for TableSecretarias
    const [selectedSecretaria, setSelectedSecretaria] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            if (indicador) {
                setFormData({
                    nombre: indicador.nombre,
                    id_secretaria: indicador.id_secretaria,
                    descripcion: indicador.descripcion || '',
                    unidad_base: indicador.unidad_base || '',
                    es_activo: indicador.es_activo === 1,
                    periodicidades: indicador.periodicidades || []
                });
                // If we have the name, we set it for display. If only ID is available, TableSecretarias might need fetching or just display ID (usually passed as object)
                // Indicador object usually has nombre_secretaria from join.
                setSelectedSecretaria({
                    id_secretaria: indicador.id_secretaria,
                    nombre: indicador.nombre_secretaria || 'Cargando...'
                });
            } else {
                setFormData({
                    nombre: '',
                    id_secretaria: '',
                    descripcion: '',
                    unidad_base: '',
                    es_activo: true,
                    periodicidades: []
                });
                setSelectedSecretaria(null);
            }
            setError('');
        }
    }, [indicador, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'periodicidades') {
            // For Select, value will be single string.
            // We save it as array for backend compatibility [value]
            setFormData(prev => ({
                ...prev,
                periodicidades: value ? [value] : []
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.id_secretaria) {
            setError('Debe seleccionar una secretaría');
            setLoading(false);
            return;
        }

        try {
            const payload = { ...formData, es_activo: formData.es_activo ? 1 : 0 };
            if (indicador) {
                await indicadoresService.update(indicador.id_indicador, payload);
            } else {
                await indicadoresService.create(payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el indicador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static" keyboard={false} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{indicador ? 'Editar Indicador' : 'Nuevo Indicador'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Alert variant="primary" className="mb-4">
                        <div className="d-flex gap-2">
                            <FaInfoCircle className="mt-1" />
                            <div>
                                <strong>Configura primero el indicador y sus variables.</strong>
                                <div className="small mt-1">Una vez creado, podrás cargar datos y generar gráficos dinámicos.</div>
                            </div>
                        </div>
                    </Alert>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Row>
                        <Col md={6}>
                            <OverlayTrigger placement="right" overlay={<Tooltip>Usa un nombre claro y descriptivo que explique qué se mide. Ejemplo: Conectividad instalada en el territorio.</Tooltip>}>
                                <div className="mb-3">
                                    <FloatingLabel controlId="floatingNombre" label="Nombre *" className="mb-0">
                                        <Form.Control
                                            type="text"
                                            name="nombre"
                                            required
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            placeholder="Ingrese nombre del indicador"
                                        />
                                    </FloatingLabel>
                                </div>
                            </OverlayTrigger>
                        </Col>
                        <Col md={6}>
                            <div className="mb-3">
                                <TableSecretarias
                                    selectedSecretaria={selectedSecretaria}
                                    onSecretariaChange={(sec) => {
                                        setSelectedSecretaria(sec);
                                        setFormData(prev => ({ ...prev, id_secretaria: sec ? sec.id_secretaria : '' }));
                                    }}
                                />
                                <Form.Text className="text-muted small">
                                    La secretaría será responsable de la estructura del indicador.
                                </Form.Text>
                            </div>
                        </Col>
                    </Row>

                    <FloatingLabel controlId="floatingDescripcion" label="Descripción" className="mb-0">
                        <Form.Control
                            as="textarea"
                            name="descripcion"
                            style={{ height: '100px' }}
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Descripción"
                        />
                    </FloatingLabel>
                    <Form.Text className="text-muted d-block mb-3 mt-0">
                        Describe brevemente el alcance del indicador y el tipo de información que contiene.
                    </Form.Text>

                    <Row>
                        <Col md={6}>
                            <div className="mb-3">
                                <FloatingLabel controlId="floatingPeriodicidad" label="Periodicidad permitida *">
                                    <Form.Select
                                        name="periodicidades"
                                        value={formData.periodicidades.length > 0 ? formData.periodicidades[0] : ''}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="anual">Anual</option>
                                        <option value="semestral">Semestral</option>
                                        <option value="trimestral">Trimestral</option>
                                        <option value="mensual">Mensual</option>
                                    </Form.Select>
                                </FloatingLabel>
                                <Form.Text className="text-muted small">
                                    Define qué periodos se pueden cargar.
                                </Form.Text>
                            </div>
                        </Col>
                        <Col md={6}>
                            <FloatingLabel controlId="floatingUnidad" label="Unidad Base (opcional)" className="mb-3">
                                <Form.Control
                                    type="text"
                                    name="unidad_base"
                                    placeholder="Ej: metros, habitantes"
                                    value={formData.unidad_base}
                                    onChange={handleChange}
                                />
                            </FloatingLabel>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3 bg-light p-3 rounded rounded-3">
                        <Form.Check
                            type="switch"
                            id="custom-switch"
                            label={<strong>Indicador Activo</strong>}
                            name="es_activo"
                            checked={formData.es_activo}
                            onChange={handleChange}
                        />
                        <Form.Text className="text-muted small ms-4">
                            Desactívalo si no quieres que sea visible para cargar datos.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : (indicador ? 'Guardar Cambios' : 'Crear Indicador')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default IndicadorForm;
