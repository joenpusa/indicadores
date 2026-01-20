import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Row, Col, Card, Spinner, Alert, FloatingLabel } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaChartBar, FaChartLine, FaChartPie, FaMapMarkedAlt } from 'react-icons/fa';
import indicadoresService from '../../services/indicadoresService';

const VisualizacionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [indicador, setIndicador] = useState(null);
    const [variables, setVariables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    const [config, setConfig] = useState({
        tipo: 'barra',
        variable_x: '',
        variable_y: '',
        agrupar_municipio: false,
        comparar_periodo: false
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [indData, varsData, configData] = await Promise.all([
                indicadoresService.getById(id),
                indicadoresService.getVariables(id),
                indicadoresService.getConfig(id)
            ]);
            setIndicador(indData);
            setVariables(varsData);
            if (configData && configData.id_grafico) {
                setConfig({
                    tipo: configData.tipo || 'barra',
                    variable_x: configData.variable_x || '',
                    variable_y: configData.variable_y || '',
                    agrupar_municipio: false, // Default for now
                    comparar_periodo: false
                });
            }
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleTypeSelect = (type) => {
        setConfig(prev => ({ ...prev, tipo: type }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setAlertMessage(null);
        try {
            await indicadoresService.saveConfig(id, config);
            setAlertMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        } catch (error) {
            console.error("Error saving config", error);
            setAlertMessage({ type: 'danger', text: 'Error al guardar configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (!indicador) return <Alert variant="warning" className="m-4">Indicador no encontrado</Alert>;

    const chartTypes = [
        { id: 'barra', name: 'Barra', icon: FaChartBar },
        { id: 'linea', name: 'Línea', icon: FaChartLine },
        { id: 'pie', name: 'Pie', icon: FaChartPie },
        { id: 'mapa', name: 'Mapa', icon: FaMapMarkedAlt },
    ];

    return (
        <div className="container-fluid">
            <div className="d-flex align-items-center mb-4">
                <Button variant="link" className="p-0 me-3 text-secondary" onClick={() => navigate('/dashboard/indicadores')}>
                    <FaArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="mb-0">{indicador.nombre}</h2>
                    <small className="text-muted">Configuración de Visualización</small>
                </div>
            </div>

            {alertMessage && (
                <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)} dismissible>
                    {alertMessage.text}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                    <Col md={12}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <h5 className="card-title mb-4">Tipo de Gráfico</h5>
                                <Row className="g-3">
                                    {chartTypes.map(type => {
                                        const Icon = type.icon;
                                        const isSelected = config.tipo === type.id;
                                        return (
                                            <Col xs={6} md={3} key={type.id}>
                                                <div
                                                    className={`p-3 text-center border rounded cursor-pointer ${isSelected ? 'bg-light border-primary text-primary' : 'text-secondary'}`}
                                                    onClick={() => handleTypeSelect(type.id)}
                                                    style={{ cursor: 'pointer', borderWidth: isSelected ? '2px' : '1px' }}
                                                >
                                                    <Icon size={32} className="mb-2" />
                                                    <div className="fw-bold">{type.name}</div>
                                                </div>
                                            </Col>
                                        )
                                    })}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={8}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Body>
                                <h5 className="card-title mb-4">Ejes</h5>

                                <FloatingLabel controlId="floatingVariableX" label="Variable Eje X" className="mb-3">
                                    <Form.Select
                                        name="variable_x"
                                        value={config.variable_x}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccione una variable...</option>
                                        <option value="periodo">Periodo (Automático)</option>
                                        {variables.map(v => (
                                            <option key={v.id_variable} value={v.id_variable}>{v.nombre} ({v.tipo})</option>
                                        ))}
                                    </Form.Select>
                                </FloatingLabel>

                                <FloatingLabel controlId="floatingVariableY" label="Variable Eje Y" className="mb-3">
                                    <Form.Select
                                        name="variable_y"
                                        value={config.variable_y}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccione una variable...</option>
                                        {variables.filter(v => v.tipo === 'numero').map(v => (
                                            <option key={v.id_variable} value={v.id_variable}>{v.nombre}</option>
                                        ))}
                                    </Form.Select>
                                </FloatingLabel>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Body>
                                <h5 className="card-title mb-4">Opciones Adicionales</h5>
                                <Form.Check
                                    type="switch"
                                    id="agrupar-switch"
                                    label="Agrupar por Municipio"
                                    name="agrupar_municipio"
                                    disabled
                                    className="mb-3"
                                />
                                <Form.Check
                                    type="switch"
                                    id="comparar-switch"
                                    label="Comparar Periodo Anterior"
                                    name="comparar_periodo"
                                    disabled
                                    className="mb-4"
                                />

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" disabled={saving}>
                                        <FaSave className="me-2" />
                                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default VisualizacionPage;
