import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Alert, Spinner, Row, Col, FloatingLabel, Tabs, Tab } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaUpload, FaDownload, FaFileExcel } from 'react-icons/fa';
import indicadoresService from '../../services/indicadoresService';
import TableMunicipios from '../settings/municipios/TableMunicipios';

const CargaDatosPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [indicador, setIndicador] = useState(null);
    const [variables, setVariables] = useState([]);
    const [periodos, setPeriodos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    // Manual Entry State
    const [formData, setFormData] = useState({
        id_municipio: '',
        id_periodo: '',
        descripcion: '',
        valores: {}
    });
    const [selectedMunicipio, setSelectedMunicipio] = useState(null);

    // Cascade Selection State
    const [selectedType, setSelectedType] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSubPeriod, setSelectedSubPeriod] = useState('');

    // Bulk Upload State
    const [file, setFile] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [indData, varsData, periodsData] = await Promise.all([
                indicadoresService.getById(id),
                indicadoresService.getVariables(id),
                indicadoresService.getPeriodos()
            ]);
            setIndicador(indData);
            setVariables(varsData);
            setPeriodos(periodsData);

            // Auto-select type if only one available
            if (indData.periodicidades && indData.periodicidades.length === 1) {
                setSelectedType(indData.periodicidades[0]);
            }
        } catch (error) {
            console.error("Error loading data", error);
            setAlert({ type: 'danger', text: 'Error al cargar información del indicador.' });
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const availableTypes = indicador?.periodicidades || [];

    // Derived Options based on Type
    const availableYears = [...new Set(periodos
        .filter(p => !selectedType || p.tipo.toLowerCase() === selectedType.toLowerCase())
        .map(p => p.anio)
    )].sort((a, b) => b - a);

    const availableSubPeriods = periodos.filter(p =>
        p.tipo.toLowerCase() === selectedType.toLowerCase() &&
        p.anio == selectedYear
    );

    useEffect(() => {
        // Reset downstream selections when upstream changes
        setSelectedYear('');
        setSelectedSubPeriod('');
        setFormData(p => ({ ...p, id_periodo: '' }));
    }, [selectedType]);

    useEffect(() => {
        setSelectedSubPeriod('');
        setFormData(p => ({ ...p, id_periodo: '' }));
    }, [selectedYear]);

    useEffect(() => {
        if (selectedSubPeriod) {
            setFormData(p => ({ ...p, id_periodo: selectedSubPeriod }));
        }
    }, [selectedSubPeriod]);


    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setAlert(null);

        if (!formData.id_municipio || !formData.id_periodo) {
            setAlert({ type: 'warning', text: 'Municipio y Periodo son obligatorios.' });
            setSubmitting(false);
            return;
        }

        const payload = {
            id_municipio: formData.id_municipio,
            id_periodo: formData.id_periodo,
            descripcion: formData.descripcion,
            valores: Object.entries(formData.valores).map(([idVar, val]) => ({
                id_variable: idVar,
                valor: val
            }))
        };

        try {
            await indicadoresService.createRegistro(id, payload);
            setAlert({ type: 'success', text: 'Datos registrados correctamente.' });
            setFormData(prev => ({ ...prev, valores: {}, descripcion: '' }));
        } catch (error) {
            console.error(error);
            setAlert({ type: 'danger', text: error.response?.data?.message || 'Error al guardar datos.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setAlert({ type: 'warning', text: 'Seleccione un archivo primero.' });
            return;
        }

        setSubmitting(true);
        setAlert(null);

        const data = new FormData();
        data.append('archivo', file);

        try {
            const response = await indicadoresService.uploadData(id, data, true);
            setAlert({ type: 'success', text: response.message || 'Carga masiva completada.' });
            setFile(null);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error en la carga masiva.';
            const details = error.response?.data?.errors ? error.response.data.errors.join(', ') : '';
            setAlert({ type: 'danger', text: `${msg} ${details}` });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await indicadoresService.downloadTemplate(id);
        } catch (error) {
            console.error(error);
            setAlert({ type: 'danger', text: 'Error al descargar la plantilla.' });
        }
    };

    const handleVariableChange = (varId, val) => {
        setFormData(prev => ({
            ...prev,
            valores: {
                ...prev.valores,
                [varId]: val
            }
        }));
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
                    <small className="text-muted">Carga de Datos</small>
                </div>
            </div>

            {alert && (
                <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                    {alert.text}
                </Alert>
            )}

            <div className="row">
                <div className="col-lg-8">
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <Tabs defaultActiveKey="manual" id="carga-tabs" className="mb-4">
                                <Tab eventKey="manual" title="Carga Manual">
                                    <Form onSubmit={handleManualSubmit}>
                                        <Row>
                                            <Col md={12} className="mb-3">
                                                <TableMunicipios
                                                    selectedMunicipio={selectedMunicipio}
                                                    onMunicipioChange={(mun) => {
                                                        setSelectedMunicipio(mun);
                                                        setFormData(p => ({ ...p, id_municipio: mun ? mun.id_municipio : '' }));
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                        <h5 className="mb-3 text-secondary border-bottom pb-2">Selección de Periodo</h5>
                                        <Row>
                                            {availableTypes.length > 1 && (
                                                <Col md={4} className="mb-3">
                                                    <FloatingLabel controlId="selectType" label="Tipo Periodo">
                                                        <Form.Select
                                                            value={selectedType}
                                                            onChange={e => setSelectedType(e.target.value)}
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            {availableTypes.map(t => (
                                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </FloatingLabel>
                                                </Col>
                                            )}

                                            <Col md={4} className="mb-3">
                                                <FloatingLabel controlId="selectYear" label="Año">
                                                    <Form.Select
                                                        value={selectedYear}
                                                        onChange={e => setSelectedYear(e.target.value)}
                                                        disabled={!selectedType}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {availableYears.map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <FloatingLabel controlId="selectSub" label="Periodo">
                                                    <Form.Select
                                                        value={selectedSubPeriod}
                                                        onChange={e => setSelectedSubPeriod(e.target.value)}
                                                        disabled={!selectedYear}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {availableSubPeriods.map(p => (
                                                            <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
                                                        ))}
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Col>
                                        </Row>

                                        <FloatingLabel controlId="floatingDesc" label="Descripción (opcional)" className="mb-4">
                                            <Form.Control
                                                as="textarea"
                                                style={{ height: '80px' }}
                                                value={formData.descripcion}
                                                onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                                            />
                                        </FloatingLabel>

                                        <h5 className="mb-3 text-secondary border-bottom pb-2">Variables</h5>

                                        <Row className="g-3">
                                            {variables.map(v => (
                                                <Col md={6} key={v.id_variable}>
                                                    <FloatingLabel label={`${v.nombre} (${v.unidad || '-'}) ${v.es_obligatoria ? '*' : ''}`}>
                                                        <Form.Control
                                                            type={v.tipo === 'numero' ? 'number' : v.tipo === 'fecha' ? 'date' : 'text'}
                                                            placeholder={v.nombre}
                                                            required={v.es_obligatoria === 1}
                                                            value={formData.valores[v.id_variable] || ''}
                                                            onChange={e => handleVariableChange(v.id_variable, e.target.value)}
                                                            step={v.tipo === 'numero' ? 'any' : undefined}
                                                        />
                                                    </FloatingLabel>
                                                </Col>
                                            ))}
                                        </Row>

                                        <div className="mt-4 d-flex justify-content-end">
                                            <Button variant="primary" type="submit" disabled={submitting}>
                                                {submitting ? <Spinner size="sm" animation="border" /> : <><FaSave className="me-2" /> Guardar Registro</>}
                                            </Button>
                                        </div>
                                    </Form>
                                </Tab>

                                <Tab eventKey="masiva" title="Carga Masiva">
                                    <div className="text-center py-4">
                                        <FaFileExcel size={48} className="text-success mb-3" />
                                        <h4>Carga de Datos desde Excel</h4>
                                        <p className="text-muted mb-4">
                                            Descarga la plantilla, diligénciala con los datos correspondientes y súbela nuevamente.
                                        </p>

                                        <div className="d-flex justify-content-center gap-3 mb-5">
                                            <Button variant="outline-success" onClick={handleDownloadTemplate}>
                                                <FaDownload className="me-2" /> Descargar Plantilla
                                            </Button>
                                        </div>

                                        <div className="card bg-light p-4 mx-auto" style={{ maxWidth: '500px' }}>
                                            <Form onSubmit={handleFileUpload}>
                                                <Form.Group controlId="formFile" className="mb-3">
                                                    <Form.Label>Seleccionar archivo (.xlsx)</Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        accept=".xlsx, .xls"
                                                        onChange={e => setFile(e.target.files[0])}
                                                    />
                                                </Form.Group>
                                                <Button variant="primary" type="submit" disabled={!file || submitting} className="w-100">
                                                    {submitting ? <Spinner size="sm" animation="border" /> : <><FaUpload className="me-2" /> Subir Archivo</>}
                                                </Button>
                                            </Form>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-lg-4">
                    <Card className="shadow-sm border-0 bg-primary text-white mb-3">
                        <Card.Body>
                            <h5 className="card-title">Instrucciones</h5>
                            <p className="small">
                                Para la carga manual:
                                <ol className="ps-3 mt-2">
                                    <li>Selecciona el municipio.</li>
                                    <li>Selecciona la periodicidad (si hay varias opciones).</li>
                                    <li>Elige el año y luego el periodo específico.</li>
                                    <li>Ingresa los valores de las variables.</li>
                                </ol>

                                Para la carga masiva:
                                <ul>
                                    <li>Descarga la plantilla.</li>
                                    <li>Usa el ID del periodo correcto.</li>
                                    <li>Usa códigos DANE para municipios.</li>
                                </ul>
                            </p>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CargaDatosPage;

