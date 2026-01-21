import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Badge, Spinner, Row, Col, Alert, FloatingLabel, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import indicadoresService from '../../services/indicadoresService';

const VariablesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [indicador, setIndicador] = useState(null);
    const [variables, setVariables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVariable, setCurrentVariable] = useState(null);
    const [formError, setFormError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'numero',
        unidad: '',
        es_dimension: false,
        es_obligatoria: false,
        orden: 0
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [indData, varsData] = await Promise.all([
                indicadoresService.getById(id),
                indicadoresService.getVariables(id)
            ]);
            setIndicador(indData);
            setVariables(varsData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (variable) => {
        setCurrentVariable(variable);
        setFormData({
            nombre: variable.nombre,
            tipo: variable.tipo,
            unidad: variable.unidad || '',
            es_dimension: variable.es_dimension === 1,
            es_obligatoria: variable.es_obligatoria === 1,
            orden: variable.orden
        });
        setIsEditing(true);
        setFormError('');
    };

    const handleCreate = () => {
        setCurrentVariable(null);
        setFormData({
            nombre: '',
            tipo: 'numero',
            unidad: '',
            es_dimension: false,
            es_obligatoria: false,
            orden: variables.length + 1
        });
        setIsEditing(true);
        setFormError('');
    };

    const handleDelete = async (varId) => {
        if (!window.confirm('¿Seguro que desea eliminar esta variable?')) return;
        try {
            await indicadoresService.deleteVariable(varId);
            loadData();
        } catch (error) {
            console.error("Error deleting variable", error);
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            setFormError('El nombre es obligatorio');
            return;
        }

        try {
            const payload = {
                ...formData,
                es_dimension: formData.es_dimension ? 1 : 0,
                es_obligatoria: formData.es_obligatoria ? 1 : 0
            };

            if (currentVariable) {
                await indicadoresService.updateVariable(currentVariable.id_variable, payload);
            } else {
                await indicadoresService.createVariable(id, payload);
            }
            setIsEditing(false);
            loadData();
        } catch (error) {
            console.error("Error saving variable", error);
            setFormError('Error al guardar la variable');
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (!indicador) return <Alert variant="warning" className="m-4">Indicador no encontrado</Alert>;

    return (
        <div className="container-fluid">
            <div className="d-flex align-items-center mb-4">
                <Button variant="link" className="p-0 me-3 text-secondary" onClick={() => navigate('/dashboard/indicadores')}>
                    <FaArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="mb-0">{indicador.nombre}</h2>
                    <small className="text-muted">Gestión de Variables</small>
                </div>
            </div>

            <Row>
                <Col md={12} className="mb-4">
                    <Alert variant="info">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <FaInfoCircle />
                            <strong>Las variables definen qué se mide en este indicador.</strong>
                        </div>
                        <ul className="mb-0 small">
                            <li>La variables basicas para todo indicador son municipio y periodo.</li>
                            <li>Puedes crear variables numéricas, de texto o de fecha.</li>
                            <li>Debes crear al menos una variable numérica para poder generar gráficos o mapas.</li>
                        </ul>
                    </Alert>
                </Col>

                <Col md={isEditing ? 8 : 12}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="text-secondary">Listado de Variables</h4>
                        {!isEditing && (
                            <Button variant="primary" onClick={handleCreate}>
                                <FaPlus className="me-2" /> Nueva Variable
                            </Button>
                        )}
                    </div>

                    {variables.map((variable) => (
                        <Card key={variable.id_variable} className="mb-3 shadow-sm border-0">
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1">{variable.nombre}</h5>
                                    <div className="d-flex gap-2">

                                        <OverlayTrigger overlay={<Tooltip>Define el tipo de dato que se registrará. Solo las variables numéricas pueden sumarse y graficarse.</Tooltip>}>
                                            <Badge bg="light" text="dark" className="border cursor-help">{variable.tipo}</Badge>
                                        </OverlayTrigger>

                                        {variable.unidad && <Badge bg="light" text="dark" className="border">Unidad: {variable.unidad}</Badge>}

                                        {variable.es_dimension === 1 && (
                                            <OverlayTrigger overlay={<Tooltip>Marca esta opción si la variable se usará para agrupar datos (Ej: tipo de cultivo).</Tooltip>}>
                                                <Badge bg="info">Dimensión</Badge>
                                            </OverlayTrigger>
                                        )}

                                        {variable.es_obligatoria === 1 && (
                                            <OverlayTrigger overlay={<Tooltip>El sistema exigirá este valor al cargar datos.</Tooltip>}>
                                                <Badge bg="danger">Obligatoria</Badge>
                                            </OverlayTrigger>
                                        )}
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(variable)}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(variable.id_variable)}>
                                        <FaTrash />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    {variables.length === 0 && (
                        <div className="text-center p-5 bg-light rounded text-muted">
                            No hay variables definidas.
                        </div>
                    )}
                </Col>

                {isEditing && (
                    <Col md={4}>
                        <Card className="shadow-lg border-0 sticky-top" style={{ top: '20px' }}>
                            <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{currentVariable ? 'Editar Variable' : 'Nueva Variable'}</h5>
                                <Button variant="link" size="sm" className="text-secondary p-0" onClick={() => setIsEditing(false)}>
                                    <FaTimes />
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {formError && <Alert variant="danger" size="sm" className="py-2">{formError}</Alert>}
                                <Form onSubmit={submitForm}>

                                    <div className="mb-3">
                                        <FloatingLabel controlId="floatingNombre" label="Nombre *">
                                            <Form.Control
                                                type="text"
                                                value={formData.nombre}
                                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                                required
                                                placeholder="Nombre de la variable"
                                            />
                                        </FloatingLabel>
                                        <Form.Text className="text-muted">
                                            Nombre corto y claro sin espacios, es la referencia del archivo de carga. Ej: hectareas, tipo_alimento.
                                        </Form.Text>
                                    </div>

                                    <div className="mb-3">
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Selecciona el tipo según el dato: Número (cantidades), Texto (categorías), Fecha (periodos).</Tooltip>}>
                                            <FloatingLabel controlId="floatingTipo" label="Tipo">
                                                <Form.Select
                                                    value={formData.tipo}
                                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                                >
                                                    <option value="numero">Número</option>
                                                    <option value="texto">Texto</option>
                                                    <option value="fecha">Fecha (Cuando requiere especifica)</option>
                                                    <option value="booleano">Booleano (Si/No)</option>
                                                </Form.Select>
                                            </FloatingLabel>
                                        </OverlayTrigger>
                                    </div>

                                    <div className="mb-3">
                                        <FloatingLabel controlId="floatingUnidad" label="Unidad">
                                            <Form.Control
                                                type="text"
                                                value={formData.unidad}
                                                onChange={e => setFormData({ ...formData, unidad: e.target.value })}
                                                placeholder="Ej: %"
                                            />
                                        </FloatingLabel>
                                        <Form.Text className="text-muted">
                                            Unidad de medida que ayudará a interpretar los gráficos. Ej: hectáreas, toneladas.
                                        </Form.Text>
                                    </div>

                                    <div className="mb-2">
                                        <Form.Check
                                            type="checkbox"
                                            label="¿Es dimensión?"
                                            id="checkDimension"
                                            checked={formData.es_dimension}
                                            onChange={e => setFormData({ ...formData, es_dimension: e.target.checked })}
                                        />
                                        <Form.Text className="text-muted d-block ms-4">
                                            Marca si se usará para agrupar datos en gráficos. Ej: tipo de zona.
                                        </Form.Text>
                                    </div>

                                    <div className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="¿Es obligatoria?"
                                            id="checkObligatoria"
                                            checked={formData.es_obligatoria}
                                            onChange={e => setFormData({ ...formData, es_obligatoria: e.target.checked })}
                                        />
                                        <Form.Text className="text-muted d-block ms-4">
                                            Si está marcada, no se permitirá guardar sin este valor.
                                        </Form.Text>
                                    </div>

                                    <div className="d-grid">
                                        <Button variant="primary" type="submit">
                                            <FaSave className="me-2" /> Guardar
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default VariablesPage;
