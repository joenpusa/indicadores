import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Card, Form, ListGroup, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaFilter, FaRedo, FaChartBar, FaInfoCircle, FaBuilding, FaCalendarAlt } from 'react-icons/fa';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import DashboardCharts from '@/components/DashboardCharts';
import indicadoresService from '@/services/indicadoresService';
import municipiosService from '@/services/municipiosService';

const TypeIndicatorsPage = () => {
    let { tipo } = useParams();
    const navigate = useNavigate();

    // Decodificar y formatear el tipo para mostrar y buscar
    const decodedTipo = decodeURIComponent(tipo || '');

    // Estados de datos
    const [loadingIndicadores, setLoadingIndicadores] = useState(true);
    const [indicadores, setIndicadores] = useState([]);
    const [selectedIndicador, setSelectedIndicador] = useState(null);

    // Estados de listas para filtros
    const [municipiosList, setMunicipiosList] = useState([]);
    const [periodosList, setPeriodosList] = useState([]);
    const [variablesList, setVariablesList] = useState([]);

    // Estados del formulario de filtros
    const [selectedMunicipio, setSelectedMunicipio] = useState('');
    const [selectedPeriodo, setSelectedPeriodo] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');

    // Estados de filtros aplicados
    const [appliedFilters, setAppliedFilters] = useState({
        id_municipio: '',
        id_periodo: '',
        id_variable: ''
    });

    // Estados para datos del dashboard
    const [loadingData, setLoadingData] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    // 1. Cargar lista de indicadores por tipo y municipios
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingIndicadores(true);
            try {
                const [indRes, munRes] = await Promise.all([
                    indicadoresService.getAll({ active: 1, tipo_indicador: decodedTipo, limit: 100 }),
                    municipiosService.getAll({ limit: 100, active: true })
                ]);

                const indicadoresData = indRes?.data || (Array.isArray(indRes) ? indRes : []);
                setIndicadores(indicadoresData);

                const munData = munRes?.data || (Array.isArray(munRes) ? munRes : []);
                setMunicipiosList(munData);

                // Precargar automáticamente el primer indicador de la lista sin filtros específicos
                if (indicadoresData.length > 0) {
                    setSelectedIndicador(indicadoresData[0]);
                } else {
                    setSelectedIndicador(null);
                }
            } catch (error) {
                console.error('Error cargando indicadores o municipios:', error);
                setIndicadores([]);
            } finally {
                setLoadingIndicadores(false);
            }
        };

        if (decodedTipo) {
            fetchInitialData();
        }
    }, [decodedTipo]);

    // 2. Al cambiar el indicador seleccionado: resetear filtros y cargar periodos/variables/dashboard
    useEffect(() => {
        const loadIndicadorDetails = async () => {
            if (!selectedIndicador) {
                setPeriodosList([]);
                setVariablesList([]);
                setDashboardData(null);
                return;
            }

            // Resetear estados de filtro al cambiar indicador
            setSelectedMunicipio('');
            setSelectedPeriodo('');
            setSelectedVariable('');
            setAppliedFilters({ id_municipio: '', id_periodo: '', id_variable: '' });

            try {
                const [perRes, varRes] = await Promise.all([
                    indicadoresService.getPeriodosByIndicador(selectedIndicador.id_indicador),
                    indicadoresService.getVariables(selectedIndicador.id_indicador)
                ]);

                setPeriodosList(Array.isArray(perRes) ? perRes : (perRes?.data || []));

                const varsData = Array.isArray(varRes) ? varRes : (varRes?.data || []);
                // Filtrar solo variables numéricas para el selector de filtro
                setVariablesList(varsData.filter(v => v.tipo === 'numero'));

                // Cargar datos del dashboard sin filtros por defecto
                fetchDashboardData(selectedIndicador.id_indicador, {});
            } catch (error) {
                console.error('Error cargando detalles del indicador:', error);
            }
        };

        loadIndicadorDetails();
    }, [selectedIndicador]);

    // Función principal para obtener datos de las gráficas
    const fetchDashboardData = async (idIndicador, filtersObj) => {
        if (!idIndicador) return;
        setLoadingData(true);
        try {
            // Limpiar valores vacíos
            const cleanParams = {};
            if (filtersObj.id_municipio) cleanParams.id_municipio = filtersObj.id_municipio;
            if (filtersObj.id_periodo) cleanParams.id_periodo = filtersObj.id_periodo;
            if (filtersObj.id_variable) cleanParams.id_variable = filtersObj.id_variable;

            const res = await indicadoresService.getDashboardData(idIndicador, cleanParams);
            setDashboardData(res || { charts: [] });
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error);
            setDashboardData({ charts: [] });
        } finally {
            setLoadingData(false);
        }
    };

    // Manejar selección en el sidebar
    const handleSelectIndicador = (ind) => {
        if (selectedIndicador?.id_indicador !== ind.id_indicador) {
            setSelectedIndicador(ind);
        }
    };

    // Manejar botón de Aplicar Filtros
    const handleApplyFilters = (e) => {
        if (e) e.preventDefault();
        if (!selectedIndicador) return;

        const newFilters = {
            id_municipio: selectedMunicipio,
            id_periodo: selectedPeriodo,
            id_variable: selectedVariable
        };

        setAppliedFilters(newFilters);
        fetchDashboardData(selectedIndicador.id_indicador, newFilters);
    };

    // Manejar botón de Limpiar Filtros
    const handleClearFilters = () => {
        if (!selectedIndicador) return;

        setSelectedMunicipio('');
        setSelectedPeriodo('');
        setSelectedVariable('');
        setAppliedFilters({ id_municipio: '', id_periodo: '', id_variable: '' });
        fetchDashboardData(selectedIndicador.id_indicador, {});
    };

    // Nombres para mostrar en los badges de filtros activos
    const getMunicipioName = (codigo) => {
        const m = municipiosList.find(item => String(item.codigo_municipio) === String(codigo));
        return m ? m.nombre : codigo;
    };

    const getPeriodoName = (id) => {
        const p = periodosList.find(item => String(item.id_periodo) === String(id));
        return p ? (p.nombre || p.anio) : id;
    };

    const getVariableName = (id) => {
        const v = variablesList.find(item => String(item.id_variable) === String(id));
        return v ? v.nombre : id;
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <PublicNavbar />
            
            {/* Uso del 100% del ancho de la página */}
            <Container fluid className="py-4 px-4 flex-grow-1">
                {/* Encabezado */}
                <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                    <Button 
                        variant="outline-secondary" 
                        className="me-3 rounded-circle d-flex p-2 shadow-sm" 
                        onClick={() => navigate('/')}
                        title="Volver al inicio"
                    >
                        <FaArrowLeft size={18} />
                    </Button>
                    <div>
                        <h2 className="mb-0 text-capitalize fw-bold text-dark">
                            Indicadores de <span className="text-primary">{decodedTipo}</span>
                        </h2>
                        <small className="text-muted fs-6">
                            Seleccione un indicador de la lista lateral para visualizar sus dimensiones y estadísticas
                        </small>
                    </div>
                </div>

                <Row className="g-4">
                    {/* COLUMNA IZQUIERDA: SIDEBAR / MENÚ DE INDICADORES */}
                    <Col xs={12} md={3} lg={3}>
                        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                            <Card.Header className="bg-white py-3 px-4 fw-bold border-bottom d-flex justify-content-between align-items-center">
                                <span className="text-dark d-flex align-items-center gap-2">
                                    <FaChartBar className="text-primary" /> Indicadores
                                </span>
                                <Badge bg="primary" pill className="px-2 py-1 fs-7">
                                    {indicadores.length}
                                </Badge>
                            </Card.Header>
                            
                            <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: '75vh' }}>
                                {loadingIndicadores ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" variant="primary" size="sm" />
                                        <p className="text-muted small mt-2 mb-0">Cargando lista...</p>
                                    </div>
                                ) : indicadores.length === 0 ? (
                                    <div className="text-center py-5 px-3">
                                        <p className="text-muted mb-0 small">
                                            No se encontraron indicadores activos clasificados como "{decodedTipo}".
                                        </p>
                                    </div>
                                ) : (
                                    indicadores.map((ind) => {
                                        const isSelected = selectedIndicador?.id_indicador === ind.id_indicador;
                                        return (
                                            <ListGroup.Item
                                                key={ind.id_indicador}
                                                action
                                                active={isSelected}
                                                onClick={() => handleSelectIndicador(ind)}
                                                className={`py-3 px-4 border-bottom transition-all ${isSelected ? 'bg-primary text-white fw-medium' : 'text-dark'}`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <span className="small fw-bold text-uppercase opacity-75">
                                                        {ind.codigo || 'IND'}
                                                    </span>
                                                    {ind.periodicidad && (
                                                        <Badge 
                                                            bg={isSelected ? 'light' : 'secondary'} 
                                                            text={isSelected ? 'primary' : 'white'}
                                                            className="fs-8 fw-normal"
                                                        >
                                                            {ind.periodicidad}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="lh-sm mb-1" style={{ fontSize: '0.95rem' }}>
                                                    {ind.nombre}
                                                </div>
                                                {ind.nombre_secretaria && (
                                                    <div className={`small mt-1 d-flex align-items-center gap-1 ${isSelected ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                                                        <FaBuilding size={11} /> {ind.nombre_secretaria}
                                                    </div>
                                                )}
                                            </ListGroup.Item>
                                        );
                                    })
                                )}
                            </ListGroup>
                        </Card>
                    </Col>

                    {/* COLUMNA DERECHA: NAVBAR DE FILTROS + GRÁFICOS */}
                    <Col xs={12} md={9} lg={9}>
                        {!selectedIndicador ? (
                            <Card className="shadow-sm border-0 rounded-4 p-5 text-center bg-white">
                                <Card.Body className="py-5">
                                    <div className="mb-3">
                                        <div className="rounded-circle bg-light d-inline-flex justify-content-center align-items-center" style={{ width: '80px', height: '80px' }}>
                                            <FaInfoCircle className="fs-1 text-secondary opacity-50" />
                                        </div>
                                    </div>
                                    <h4 className="fw-bold text-secondary mb-2">Ningún Indicador Seleccionado</h4>
                                    <p className="text-muted mb-0 max-w-md mx-auto">
                                        Por favor seleccione un indicador de la barra lateral izquierda para explorar sus filtros y visualizaciones estadísticas.
                                    </p>
                                </Card.Body>
                            </Card>
                        ) : (
                            <>
                                {/* NAVBAR DE FILTROS SUPERIOR (ESTILO FORM INLINE) */}
                                <Card className="shadow-sm border-0 rounded-4 mb-4 bg-white p-3">
                                    <Form onSubmit={handleApplyFilters} className="row g-2 align-items-end">
                                        <Col xs={12} sm={6} md={3}>
                                            <Form.Label className="small fw-semibold text-secondary mb-1">
                                                Municipio
                                            </Form.Label>
                                            <Form.Select 
                                                size="sm"
                                                value={selectedMunicipio}
                                                onChange={(e) => setSelectedMunicipio(e.target.value)}
                                                className="border-secondary border-opacity-25 shadow-none"
                                            >
                                                <option value="">Todos los municipios</option>
                                                {municipiosList.map(mun => (
                                                    <option key={mun.id_municipio} value={mun.codigo_municipio}>
                                                        {mun.nombre}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>

                                        <Col xs={12} sm={6} md={3}>
                                            <Form.Label className="small fw-semibold text-secondary mb-1">
                                                Periodo
                                            </Form.Label>
                                            <Form.Select 
                                                size="sm"
                                                value={selectedPeriodo}
                                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                                className="border-secondary border-opacity-25 shadow-none"
                                                disabled={periodosList.length === 0}
                                            >
                                                <option value="">Todos los periodos</option>
                                                {periodosList.map(per => (
                                                    <option key={per.id_periodo} value={per.id_periodo}>
                                                        {per.nombre || per.anio}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>

                                        <Col xs={12} sm={6} md={3}>
                                            <Form.Label className="small fw-semibold text-secondary mb-1">
                                                Variable
                                            </Form.Label>
                                            <Form.Select 
                                                size="sm"
                                                value={selectedVariable}
                                                onChange={(e) => setSelectedVariable(e.target.value)}
                                                className="border-secondary border-opacity-25 shadow-none"
                                                disabled={variablesList.length === 0}
                                            >
                                                <option value="">Todas las variables</option>
                                                {variablesList.map(v => (
                                                    <option key={v.id_variable} value={v.id_variable}>
                                                        {v.nombre} {v.unidad ? `(${v.unidad})` : ''}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>

                                        <Col xs={12} sm={6} md={3} className="d-flex gap-2">
                                            <Button 
                                                type="submit" 
                                                variant="primary" 
                                                size="sm" 
                                                className="flex-grow-1 d-flex align-items-center justify-content-center gap-1 fw-medium"
                                                disabled={loadingData}
                                            >
                                                <FaFilter size={12} /> Aplicar
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={handleClearFilters}
                                                title="Limpiar filtros"
                                                className="d-flex align-items-center justify-content-center px-3"
                                                disabled={loadingData}
                                            >
                                                <FaRedo size={12} />
                                            </Button>
                                        </Col>
                                    </Form>
                                </Card>

                                {/* TARJETA DE INFORMACIÓN DEL INDICADOR SELECCIONADO */}
                                <Card className="shadow-sm border-0 rounded-4 mb-4 bg-white border-start border-primary border-4">
                                    <Card.Body className="p-4">
                                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                            <h3 className="fw-bold text-dark mb-0">
                                                {selectedIndicador.nombre}
                                            </h3>
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                                {selectedIndicador.codigo && (
                                                    <Badge bg="secondary" className="px-2 py-1">
                                                        Código: {selectedIndicador.codigo}
                                                    </Badge>
                                                )}
                                                {selectedIndicador.periodicidad && (
                                                    <Badge bg="info" text="white" className="px-2 py-1 d-flex align-items-center gap-1">
                                                        <FaCalendarAlt size={11} /> {selectedIndicador.periodicidad}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {selectedIndicador.descripcion && (
                                            <p className="text-muted mb-3 fs-6">
                                                {selectedIndicador.descripcion}
                                            </p>
                                        )}

                                        <div className="d-flex flex-wrap gap-4 pt-2 border-top small text-secondary">
                                            {selectedIndicador.nombre_secretaria && (
                                                <div>
                                                    <strong>Secretaría:</strong> {selectedIndicador.nombre_secretaria}
                                                </div>
                                            )}
                                            {selectedIndicador.unidad_base && (
                                                <div>
                                                    <strong>Unidad Base:</strong> {selectedIndicador.unidad_base}
                                                </div>
                                            )}
                                            {selectedIndicador.tendencia_deseada && (
                                                <div>
                                                    <strong>Tendencia deseada:</strong>{' '}
                                                    <span className="text-capitalize">{selectedIndicador.tendencia_deseada}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges de filtros aplicados actualmente */}
                                        {(appliedFilters.id_municipio || appliedFilters.id_periodo || appliedFilters.id_variable) && (
                                            <div className="mt-3 pt-3 border-top d-flex flex-wrap align-items-center gap-2">
                                                <span className="small fw-bold text-muted me-1">Filtros activos:</span>
                                                {appliedFilters.id_municipio && (
                                                    <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                        Municipio: <strong className="text-primary">{getMunicipioName(appliedFilters.id_municipio)}</strong>
                                                    </Badge>
                                                )}
                                                {appliedFilters.id_periodo && (
                                                    <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                        Periodo: <strong className="text-primary">{getPeriodoName(appliedFilters.id_periodo)}</strong>
                                                    </Badge>
                                                )}
                                                {appliedFilters.id_variable && (
                                                    <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                        Variable: <strong className="text-primary">{getVariableName(appliedFilters.id_variable)}</strong>
                                                    </Badge>
                                                )}
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="p-0 text-decoration-none small text-danger ms-2"
                                                    onClick={handleClearFilters}
                                                >
                                                    Remover filtros
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* PANEL DE GRÁFICOS (SIN MAPA) */}
                                <Card className="shadow-sm border-0 rounded-4 bg-white p-4">
                                    <Card.Header className="bg-white px-0 pt-0 pb-3 mb-3 border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                            <FaChartBar className="text-primary" /> Gráficos de Dimensiones
                                        </h5>
                                        <span className="small text-muted">
                                            Desglose de datos en el tiempo
                                        </span>
                                    </Card.Header>

                                    <Card.Body className="px-0 py-2">
                                        {loadingData ? (
                                            <div className="text-center py-5 my-4">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="text-muted mt-3 mb-0">Cargando visualizaciones estadísticas...</p>
                                            </div>
                                        ) : !dashboardData || !dashboardData.charts || dashboardData.charts.length === 0 ? (
                                            <Alert variant="light" className="text-center border py-5 my-2 rounded-3">
                                                <FaInfoCircle className="text-secondary fs-3 mb-3" />
                                                <h6 className="fw-bold text-dark">No hay datos disponibles para graficar</h6>
                                                <p className="text-muted small mb-0 max-w-md mx-auto">
                                                    Este indicador aún no cuenta con registros cargados o no existen datos que coincidan con los filtros seleccionados actualmente.
                                                </p>
                                            </Alert>
                                        ) : (
                                            <DashboardCharts charts={dashboardData.charts} />
                                        )}
                                    </Card.Body>
                                </Card>
                            </>
                        )}
                    </Col>
                </Row>
            </Container>

            <PublicFooter />
        </div>
    );
};

export default TypeIndicatorsPage;
