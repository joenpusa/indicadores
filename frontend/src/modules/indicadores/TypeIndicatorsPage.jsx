import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Button, Container, Row, Col, Card, Form, ListGroup, 
    Spinner, Badge, Alert, Dropdown, Collapse 
} from 'react-bootstrap';
import { 
    FaArrowLeft, FaFilter, FaRedo, FaChartBar, FaInfoCircle, 
    FaBuilding, FaCalendarAlt, FaCheck, FaTimes, FaSearch, 
    FaLayerGroup, FaThLarge, FaCogs, FaCheckSquare, FaSquare
} from 'react-icons/fa';
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

    // Listas base para filtros
    const [municipiosList, setMunicipiosList] = useState([]);
    const [periodosList, setPeriodosList] = useState([]);
    const [variablesList, setVariablesList] = useState([]);
    const [dimensionOptionsList, setDimensionOptionsList] = useState([]);

    // ========================================================
    // ESTADOS DE FILTRO (MULTI-SELECCIÓN Y AGRUPAMIENTO)
    // ========================================================
    // 1. Municipios: array de codigo_municipio. Vacío [] significa "Todos los municipios"
    const [selectedMunicipios, setSelectedMunicipios] = useState([]);
    // Opción "Agrupar por municipios": suma los valores agrupados por municipios
    const [agruparMunicipios, setAgruparMunicipios] = useState(true);

    // 2. Periodos: array de id_periodo. Vacío [] significa "Todos los periodos"
    const [selectedPeriodos, setSelectedPeriodos] = useState([]);
    // Opción "Agrupamiento de periodos": 'ninguno' | 'anio' | 'todos'
    const [agruparPeriodos, setAgruparPeriodos] = useState('ninguno');

    // 3. Variables:
    // Opción "Agrupar todas las variables": true muestra todas las numéricas juntas
    const [agruparVariables, setAgruparVariables] = useState(true);
    const [selectedVariable, setSelectedVariable] = useState(''); // cuando no está agrupando todas

    // 4. Dimensión / Desagregación (ej. Cultivo, Grupo de edad si existe)
    const [selectedDimensionValor, setSelectedDimensionValor] = useState('');

    // Toggle para panel de Slicers estilo Excel (botones interactivos)
    const [showExcelSlicers, setShowExcelSlicers] = useState(false);

    // Búsqueda en menú desplegable de municipios
    const [munSearchTerm, setMunSearchTerm] = useState('');

    // Estados de filtros aplicados actualmente en el gráfico
    const [appliedFilters, setAppliedFilters] = useState({
        id_municipio: [],
        agrupar_municipios: true,
        id_periodo: [],
        agrupar_periodos: 'ninguno',
        agrupar_variables: true,
        id_variable: '',
        dimension_valor: ''
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

                // Precargar automáticamente el primer indicador de la lista
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
                setDimensionOptionsList([]);
                setDashboardData(null);
                return;
            }

            // Resetear estados de filtros al cambiar indicador
            setSelectedMunicipios([]);
            setAgruparMunicipios(true);
            setSelectedPeriodos([]);
            setAgruparPeriodos('ninguno');
            setAgruparVariables(true);
            setSelectedVariable('');
            setSelectedDimensionValor('');
            setMunSearchTerm('');

            const initialFilters = {
                id_municipio: [],
                agrupar_municipios: true,
                id_periodo: [],
                agrupar_periodos: 'ninguno',
                agrupar_variables: true,
                id_variable: '',
                dimension_valor: ''
            };
            setAppliedFilters(initialFilters);

            try {
                const [perRes, varRes] = await Promise.all([
                    indicadoresService.getPeriodosByIndicador(selectedIndicador.id_indicador),
                    indicadoresService.getVariables(selectedIndicador.id_indicador)
                ]);

                const perList = Array.isArray(perRes) ? perRes : (perRes?.data || []);
                setPeriodosList(perList);

                const varsData = Array.isArray(varRes) ? varRes : (varRes?.data || []);
                // Filtrar solo variables numéricas
                setVariablesList(varsData.filter(v => v.tipo === 'numero'));

                // Cargar datos del dashboard por defecto
                fetchDashboardData(selectedIndicador.id_indicador, initialFilters);
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
            const cleanParams = {};

            // Multi-municipio
            if (filtersObj.id_municipio && filtersObj.id_municipio.length > 0) {
                cleanParams.id_municipio = Array.isArray(filtersObj.id_municipio) 
                    ? filtersObj.id_municipio.join(',') 
                    : filtersObj.id_municipio;
            }
            cleanParams.agrupar_municipios = filtersObj.agrupar_municipios ? 'true' : 'false';

            // Multi-periodo
            if (filtersObj.id_periodo && filtersObj.id_periodo.length > 0) {
                cleanParams.id_periodo = Array.isArray(filtersObj.id_periodo) 
                    ? filtersObj.id_periodo.join(',') 
                    : filtersObj.id_periodo;
            }
            cleanParams.agrupar_periodos = filtersObj.agrupar_periodos || 'ninguno';

            // Variable y agrupación de variables
            cleanParams.agrupar_variables = filtersObj.agrupar_variables ? 'true' : 'false';
            if (!filtersObj.agrupar_variables && filtersObj.id_variable) {
                cleanParams.id_variable = filtersObj.id_variable;
            }

            // Dimensión opcional (desagregación de cultivo o texto)
            if (filtersObj.dimension_valor) {
                cleanParams.dimension_valor = filtersObj.dimension_valor;
            }

            const res = await indicadoresService.getDashboardData(idIndicador, cleanParams);
            setDashboardData(res || { charts: [] });

            if (res?.dimensionOptions && res.dimensionOptions.length > 0) {
                setDimensionOptionsList(res.dimensionOptions);
            }
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
            id_municipio: selectedMunicipios,
            agrupar_municipios: agruparMunicipios,
            id_periodo: selectedPeriodos,
            agrupar_periodos: agruparPeriodos,
            agrupar_variables: agruparVariables,
            id_variable: agruparVariables ? '' : selectedVariable,
            dimension_valor: selectedDimensionValor
        };

        setAppliedFilters(newFilters);
        fetchDashboardData(selectedIndicador.id_indicador, newFilters);
    };

    // Manejar botón de Limpiar Filtros
    const handleClearFilters = () => {
        if (!selectedIndicador) return;

        setSelectedMunicipios([]);
        setAgruparMunicipios(true);
        setSelectedPeriodos([]);
        setAgruparPeriodos('ninguno');
        setAgruparVariables(true);
        setSelectedVariable('');
        setSelectedDimensionValor('');
        setMunSearchTerm('');

        const resetFilters = {
            id_municipio: [],
            agrupar_municipios: true,
            id_periodo: [],
            agrupar_periodos: 'ninguno',
            agrupar_variables: true,
            id_variable: '',
            dimension_valor: ''
        };
        setAppliedFilters(resetFilters);
        fetchDashboardData(selectedIndicador.id_indicador, resetFilters);
    };

    // ========================================================
    // HELPERS PARA MULTI-SELECCIÓN DE MUNICIPIOS
    // ========================================================
    const toggleMunicipio = (codigo) => {
        setSelectedMunicipios(prev => {
            const strCod = String(codigo);
            if (prev.includes(strCod)) {
                return prev.filter(c => c !== strCod);
            } else {
                return [...prev, strCod];
            }
        });
    };

    const selectAllMunicipios = () => {
        setSelectedMunicipios([]); // Vacío significa todos
    };

    const deselectAllMunicipios = () => {
        setSelectedMunicipios(['__none__']); // Fuerza ninguno
    };

    const filteredMunicipios = useMemo(() => {
        if (!munSearchTerm) return municipiosList;
        const term = munSearchTerm.toLowerCase();
        return municipiosList.filter(m => 
            m.nombre.toLowerCase().includes(term) || String(m.codigo_municipio).includes(term)
        );
    }, [municipiosList, munSearchTerm]);

    // ========================================================
    // HELPERS PARA MULTI-SELECCIÓN DE PERIODOS
    // ========================================================
    const formatPeriodo = (per) => {
        if (!per) return '';
        if (per.nombre) return per.nombre;
        if (!per.numero) return String(per.anio);

        const { tipo, anio, numero } = per;
        if (tipo === 'semestral') {
            const sem = numero === 1 ? 'A' : (numero === 2 ? 'B' : numero);
            return `${anio}${sem} (${anio} - Semestre ${numero})`;
        }
        if (tipo === 'trimestral') return `${anio} - Trimestre ${numero}`;
        if (tipo === 'mensual') {
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return `${anio} - ${meses[numero - 1] || 'Mes ' + numero}`;
        }
        if (tipo === 'salud') return `${anio} - Salud ${String(numero).padStart(2, '0')}`;
        return `${anio} - ${numero}`;
    };

    const togglePeriodo = (id) => {
        const strId = String(id);
        setSelectedPeriodos(prev => {
            if (prev.includes(strId)) {
                return prev.filter(i => i !== strId);
            } else {
                return [...prev, strId];
            }
        });
    };

    const selectAllPeriodos = () => {
        setSelectedPeriodos([]); // Vacío significa todos
    };

    // Nombres para mostrar en los badges de filtros activos
    const getMunicipioName = (codigo) => {
        const m = municipiosList.find(item => String(item.codigo_municipio) === String(codigo));
        return m ? m.nombre : codigo;
    };

    const getPeriodoName = (id) => {
        const p = periodosList.find(item => String(item.id_periodo) === String(id));
        return p ? formatPeriodo(p) : id;
    };

    const getVariableName = (id) => {
        const v = variablesList.find(item => String(item.id_variable) === String(id));
        return v ? v.nombre : id;
    };

    // Label actual del botón de Municipios
    const municipioButtonLabel = useMemo(() => {
        if (selectedMunicipios.length === 0) return 'Todos los municipios';
        if (selectedMunicipios.includes('__none__')) return 'Ningún municipio';
        if (selectedMunicipios.length === 1) return getMunicipioName(selectedMunicipios[0]);
        return `${selectedMunicipios.length} municipios seleccionados`;
    }, [selectedMunicipios, municipiosList]);

    // Label actual del botón de Periodos
    const periodoButtonLabel = useMemo(() => {
        if (selectedPeriodos.length === 0) return 'Todos los periodos';
        if (selectedPeriodos.length === 1) return getPeriodoName(selectedPeriodos[0]);
        return `${selectedPeriodos.length} periodos seleccionados`;
    }, [selectedPeriodos, periodosList]);

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <PublicNavbar />
            
            <Container fluid className="py-4 px-4 flex-grow-1">
                {/* Encabezado Principal */}
                <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
                    <div className="d-flex align-items-center">
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
                                Visualice estadísticas consolidadas, agrupamientos y filtros interactivos estilo macro
                            </small>
                        </div>
                    </div>

                    {selectedIndicador && (
                        <Button
                            variant={showExcelSlicers ? 'primary' : 'outline-primary'}
                            size="sm"
                            className="d-flex align-items-center gap-2 fw-medium shadow-sm px-3 py-2 rounded-3"
                            onClick={() => setShowExcelSlicers(!showExcelSlicers)}
                        >
                            <FaThLarge size={14} /> 
                            {showExcelSlicers ? 'Ocultar Panel de Slicers' : 'Ver Slicers (Estilo Excel)'}
                        </Button>
                    )}
                </div>

                <Row className="g-4">
                    {/* COLUMNA IZQUIERDA: SIDEBAR / MENÚ DE INDICADORES */}
                    <Col xs={12} md={3} lg={3}>
                        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
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
                                                            className="fs-8 fw-normal text-capitalize"
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
                                {/* PANEL COLLAPSIBLE DE SLICERS INTERACTIVOS (ESTILO EXCEL EXACTO) */}
                                <Collapse in={showExcelSlicers}>
                                    <div className="mb-4">
                                        <Card className="shadow-sm border-0 rounded-4 bg-white p-3 border-top border-primary border-3">
                                            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                                <div className="d-flex align-items-center gap-2">
                                                    <FaThLarge className="text-primary" />
                                                    <h6 className="fw-bold mb-0 text-dark">Segmentación de Datos (Slicers Interactivos)</h6>
                                                </div>
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    onClick={handleApplyFilters}
                                                    className="d-flex align-items-center gap-1 px-3 shadow-sm fw-medium"
                                                >
                                                    <FaFilter size={12} /> Actualizar Gráfica
                                                </Button>
                                            </div>

                                            <Row className="g-3">
                                                {/* SLICER 1: MUNICIPIO */}
                                                <Col xs={12} md={dimensionOptionsList.length > 0 ? 8 : 12}>
                                                    <Card className="border bg-light rounded-3 h-100">
                                                        <Card.Header className="bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                                                            <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                                                                <FaBuilding className="text-primary" /> Municipio
                                                            </span>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <Button 
                                                                    variant="link" 
                                                                    size="sm" 
                                                                    className="p-0 small text-decoration-none"
                                                                    onClick={selectAllMunicipios}
                                                                >
                                                                    Todos
                                                                </Button>
                                                                <span className="text-muted">|</span>
                                                                <Button 
                                                                    variant="link" 
                                                                    size="sm" 
                                                                    className="p-0 small text-decoration-none text-danger"
                                                                    onClick={deselectAllMunicipios}
                                                                >
                                                                    Ninguno
                                                                </Button>
                                                            </div>
                                                        </Card.Header>
                                                        <Card.Body className="p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {municipiosList.map(mun => {
                                                                    const strCod = String(mun.codigo_municipio);
                                                                    const isSelected = selectedMunicipios.length === 0 || selectedMunicipios.includes(strCod);
                                                                    return (
                                                                        <Button
                                                                            key={mun.id_municipio}
                                                                            size="sm"
                                                                            variant={isSelected ? 'success' : 'outline-secondary'}
                                                                            className={`px-2 py-1 small rounded-2 text-truncate ${isSelected ? 'fw-semibold text-white' : 'opacity-75'}`}
                                                                            style={{ minWidth: '95px', maxWidth: '140px', fontSize: '0.8rem' }}
                                                                            onClick={() => toggleMunicipio(strCod)}
                                                                            title={mun.nombre}
                                                                        >
                                                                            {mun.nombre}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>

                                                {/* SLICER 2: DESAGREGACIÓN / DIMENSIÓN DE CULTIVO O CATEGORÍA */}
                                                {dimensionOptionsList.length > 0 && (
                                                    <Col xs={12} md={4}>
                                                        <Card className="border bg-light rounded-3 h-100">
                                                            <Card.Header className="bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                                                                <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                                                                    <FaLayerGroup className="text-success" /> Desagregación
                                                                </span>
                                                                <Button 
                                                                    variant="link" 
                                                                    size="sm" 
                                                                    className="p-0 small text-decoration-none"
                                                                    onClick={() => setSelectedDimensionValor('')}
                                                                >
                                                                    Todas
                                                                </Button>
                                                            </Card.Header>
                                                            <Card.Body className="p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {dimensionOptionsList.map(opt => {
                                                                        const isSel = selectedDimensionValor === opt.valor;
                                                                        return (
                                                                            <Button
                                                                                key={opt.valor}
                                                                                size="sm"
                                                                                variant={isSel ? 'primary' : 'outline-secondary'}
                                                                                className={`px-2 py-1 small rounded-2 text-truncate ${isSel ? 'fw-bold' : ''}`}
                                                                                style={{ fontSize: '0.8rem' }}
                                                                                onClick={() => setSelectedDimensionValor(isSel ? '' : opt.valor)}
                                                                            >
                                                                                {opt.valor}
                                                                            </Button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                )}
                                            </Row>
                                        </Card>
                                    </div>
                                </Collapse>

                                {/* NAVBAR DE FILTROS SUPERIOR (COMPLETO CON MULTI-SELECCIÓN Y AGRUPAMIENTO) */}
                                <Card className="shadow-sm border-0 rounded-4 mb-4 bg-white p-3">
                                    <Form onSubmit={handleApplyFilters}>
                                        <Row className="g-3 align-items-start">
                                            {/* FILTRO 1: MUNICIPIO (MULTI-SELECT + TOGGLE AGRUPAR) */}
                                            <Col xs={12} sm={6} md={3}>
                                                <Form.Label className="small fw-semibold text-secondary mb-1 d-flex justify-content-between align-items-center">
                                                    <span>Municipio</span>
                                                    {selectedMunicipios.length > 0 && !selectedMunicipios.includes('__none__') && (
                                                        <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                                            {selectedMunicipios.length} sel.
                                                        </span>
                                                    )}
                                                </Form.Label>
                                                
                                                <Dropdown autoClose="outside" className="w-100">
                                                    <Dropdown.Toggle 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        className="w-100 text-truncate text-start d-flex justify-content-between align-items-center border-secondary border-opacity-25 shadow-none"
                                                    >
                                                        <span className="text-truncate">{municipioButtonLabel}</span>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu className="p-2 shadow-lg border-0 rounded-3" style={{ minWidth: '280px', maxHeight: '350px' }}>
                                                        <div className="mb-2">
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text bg-light border-end-0">
                                                                    <FaSearch size={11} className="text-muted" />
                                                                </span>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Buscar municipio..."
                                                                    size="sm"
                                                                    value={munSearchTerm}
                                                                    onChange={(e) => setMunSearchTerm(e.target.value)}
                                                                    className="border-start-0"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="d-flex justify-content-between mb-2 pb-1 border-bottom px-1">
                                                            <Button variant="link" size="sm" className="p-0 text-decoration-none small text-primary" onClick={selectAllMunicipios}>
                                                                Seleccionar todos
                                                            </Button>
                                                            <Button variant="link" size="sm" className="p-0 text-decoration-none small text-danger" onClick={deselectAllMunicipios}>
                                                                Limpiar
                                                            </Button>
                                                        </div>

                                                        <div className="overflow-auto" style={{ maxHeight: '220px' }}>
                                                            {filteredMunicipios.map(mun => {
                                                                const strCod = String(mun.codigo_municipio);
                                                                const isChecked = selectedMunicipios.length === 0 || selectedMunicipios.includes(strCod);
                                                                return (
                                                                    <Form.Check
                                                                        key={mun.id_municipio}
                                                                        type="checkbox"
                                                                        id={`chk-mun-${mun.id_municipio}`}
                                                                        label={mun.nombre}
                                                                        checked={isChecked}
                                                                        onChange={() => toggleMunicipio(strCod)}
                                                                        className="py-1 px-2 small rounded hover-bg"
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </Dropdown.Menu>
                                                </Dropdown>

                                                {/* OPCIÓN: AGRUPAR POR MUNICIPIOS */}
                                                <div className="mt-2 pt-1 border-top">
                                                    <Form.Check 
                                                        type="switch"
                                                        id="switch-agrupar-municipios"
                                                        label={<span className="small fw-semibold text-dark">Agrupar por municipios</span>}
                                                        checked={agruparMunicipios}
                                                        onChange={(e) => setAgruparMunicipios(e.target.checked)}
                                                        title="Suma los valores agrupados por municipios en una sola cifra consolidada"
                                                    />
                                                    <small className="text-muted d-block" style={{ fontSize: '0.72rem', lineHeight: '1.1' }}>
                                                        {agruparMunicipios ? 'Suma valores de municipios' : 'Desglosado por municipio'}
                                                    </small>
                                                </div>
                                            </Col>

                                            {/* FILTRO 2: PERIODO (MULTI-SELECT + AGRUPAMIENTO DE PERIODOS) */}
                                            <Col xs={12} sm={6} md={3}>
                                                <Form.Label className="small fw-semibold text-secondary mb-1 d-flex justify-content-between align-items-center">
                                                    <span>Periodo</span>
                                                    {selectedPeriodos.length > 0 && (
                                                        <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                                            {selectedPeriodos.length} sel.
                                                        </span>
                                                    )}
                                                </Form.Label>

                                                <Dropdown autoClose="outside" className="w-100">
                                                    <Dropdown.Toggle 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        className="w-100 text-truncate text-start d-flex justify-content-between align-items-center border-secondary border-opacity-25 shadow-none"
                                                        disabled={periodosList.length === 0}
                                                    >
                                                        <span className="text-truncate">{periodoButtonLabel}</span>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu className="p-2 shadow-lg border-0 rounded-3" style={{ minWidth: '260px', maxHeight: '300px' }}>
                                                        <div className="d-flex justify-content-between mb-2 pb-1 border-bottom px-1">
                                                            <Button variant="link" size="sm" className="p-0 text-decoration-none small text-primary" onClick={selectAllPeriodos}>
                                                                Todos los periodos
                                                            </Button>
                                                            <Button variant="link" size="sm" className="p-0 text-decoration-none small text-danger" onClick={() => setSelectedPeriodos(['__none__'])}>
                                                                Limpiar
                                                            </Button>
                                                        </div>

                                                        <div className="overflow-auto" style={{ maxHeight: '200px' }}>
                                                            {periodosList.map(per => {
                                                                const strId = String(per.id_periodo);
                                                                const isChecked = selectedPeriodos.length === 0 || selectedPeriodos.includes(strId);
                                                                return (
                                                                    <Form.Check
                                                                        key={per.id_periodo}
                                                                        type="checkbox"
                                                                        id={`chk-per-${per.id_periodo}`}
                                                                        label={formatPeriodo(per)}
                                                                        checked={isChecked}
                                                                        onChange={() => togglePeriodo(strId)}
                                                                        className="py-1 px-2 small rounded hover-bg"
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </Dropdown.Menu>
                                                </Dropdown>

                                                {/* OPCIÓN: AGRUPAMIENTO DE PERIODOS */}
                                                <div className="mt-2 pt-1 border-top">
                                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                                        <span className="small fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>
                                                            Agrupamiento periodo:
                                                        </span>
                                                    </div>
                                                    <Form.Select
                                                        size="sm"
                                                        value={agruparPeriodos}
                                                        onChange={(e) => setAgruparPeriodos(e.target.value)}
                                                        className="border-secondary border-opacity-25 shadow-none py-1"
                                                        style={{ fontSize: '0.8rem' }}
                                                    >
                                                        <option value="ninguno">Sin agrupar (Detallado)</option>
                                                        <option value="anio">Agrupar por Año</option>
                                                        <option value="todos">Consolidar todos los periodos</option>
                                                    </Form.Select>
                                                </div>
                                            </Col>

                                            {/* FILTRO 3: VARIABLE (AGRUPAR TODAS LAS VARIABLES O SELECCIONAR ESPECÍFICA) */}
                                            <Col xs={12} sm={6} md={3}>
                                                <Form.Label className="small fw-semibold text-secondary mb-1">
                                                    Variables
                                                </Form.Label>

                                                {!agruparVariables ? (
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
                                                ) : (
                                                    <div className="form-control form-control-sm bg-light border-secondary border-opacity-25 text-muted d-flex align-items-center">
                                                        <span className="small fw-medium text-primary">
                                                            Todas las variables agrupadas ({variablesList.length})
                                                        </span>
                                                    </div>
                                                )}

                                                {/* OPCIÓN: AGRUPAR TODAS LAS VARIABLES */}
                                                <div className="mt-2 pt-1 border-top">
                                                    <Form.Check 
                                                        type="switch"
                                                        id="switch-agrupar-variables"
                                                        label={<span className="small fw-semibold text-dark">Agrupar todas las variables</span>}
                                                        checked={agruparVariables}
                                                        onChange={(e) => setAgruparVariables(e.target.checked)}
                                                        title="Muestra todas las variables comparadas en el gráfico y la tabla"
                                                    />
                                                    <small className="text-muted d-block" style={{ fontSize: '0.72rem', lineHeight: '1.1' }}>
                                                        {agruparVariables ? 'Compara todas las series' : 'Filtrar variable específica'}
                                                    </small>
                                                </div>
                                            </Col>

                                            {/* FILTRO 4 / BOTONES DE ACCIÓN */}
                                            <Col xs={12} sm={6} md={3} className="d-flex flex-column justify-content-between h-100">
                                                {/* Desagregación / Dimensión si existe */}
                                                {dimensionOptionsList.length > 0 ? (
                                                    <div className="mb-2">
                                                        <Form.Label className="small fw-semibold text-secondary mb-1">
                                                            Desagregación / Dimensión
                                                        </Form.Label>
                                                        <Form.Select
                                                            size="sm"
                                                            value={selectedDimensionValor}
                                                            onChange={(e) => setSelectedDimensionValor(e.target.value)}
                                                            className="border-secondary border-opacity-25 shadow-none"
                                                        >
                                                            <option value="">Todas las categorías</option>
                                                            {dimensionOptionsList.map(opt => (
                                                                <option key={opt.valor} value={opt.valor}>
                                                                    {opt.valor}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </div>
                                                ) : (
                                                    <div className="mb-2">
                                                        <Form.Label className="small fw-semibold text-secondary mb-1">
                                                            Acciones de Filtro
                                                        </Form.Label>
                                                        <div className="small text-muted py-1">
                                                            Presione aplicar para refrescar el cálculo
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex gap-2 mt-auto pt-2">
                                                    <Button 
                                                        type="submit" 
                                                        variant="primary" 
                                                        size="sm" 
                                                        className="flex-grow-1 d-flex align-items-center justify-content-center gap-1 fw-medium shadow-sm py-2"
                                                        disabled={loadingData}
                                                    >
                                                        <FaFilter size={12} /> Aplicar Filtros
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
                                                </div>
                                            </Col>
                                        </Row>
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
                                                    <Badge bg="info" text="white" className="px-2 py-1 d-flex align-items-center gap-1 text-capitalize">
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
                                        <div className="mt-3 pt-3 border-top d-flex flex-wrap align-items-center gap-2">
                                            <span className="small fw-bold text-muted me-1">Estado de filtros:</span>
                                            
                                            {/* Municipio Badge */}
                                            <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                Municipios: <strong className="text-primary">{municipioButtonLabel}</strong>
                                                {' '}
                                                <span className="badge bg-primary ms-1" style={{ fontSize: '0.7rem' }}>
                                                    {appliedFilters.agrupar_municipios ? 'Agrupados (Suma)' : 'Desglosados'}
                                                </span>
                                            </Badge>

                                            {/* Periodo Badge */}
                                            <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                Periodos: <strong className="text-primary">{periodoButtonLabel}</strong>
                                                {' '}
                                                <span className="badge bg-secondary ms-1" style={{ fontSize: '0.7rem' }}>
                                                    {appliedFilters.agrupar_periodos === 'anio' ? 'Por Año' : appliedFilters.agrupar_periodos === 'todos' ? 'Total Periodo' : 'Detalle'}
                                                </span>
                                            </Badge>

                                            {/* Variables Badge */}
                                            <Badge bg="light" text="dark" className="border border-primary px-2 py-1 fw-normal shadow-sm">
                                                Variables: <strong className="text-primary">
                                                    {appliedFilters.agrupar_variables ? 'Todas agrupadas' : (getVariableName(appliedFilters.id_variable) || 'Todas')}
                                                </strong>
                                            </Badge>

                                            {/* Dimensión si aplica */}
                                            {appliedFilters.dimension_valor && (
                                                <Badge bg="light" text="dark" className="border border-success px-2 py-1 fw-normal shadow-sm">
                                                    Desagregación: <strong className="text-success">{appliedFilters.dimension_valor}</strong>
                                                </Badge>
                                            )}

                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="p-0 text-decoration-none small text-danger ms-2"
                                                onClick={handleClearFilters}
                                            >
                                                Restablecer filtros
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* PANEL PRINCIPAL DE GRÁFICOS Y TABLA DE DATOS */}
                                <Card className="shadow-sm border-0 rounded-4 bg-white p-4">
                                    <Card.Header className="bg-white px-0 pt-0 pb-3 mb-3 border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                            <FaChartBar className="text-primary" /> Visualización Estadística y Gráficos
                                        </h5>
                                        <span className="small text-muted">
                                            {appliedFilters.agrupar_municipios ? 'Consolidado general' : 'Detalle por municipio'}
                                        </span>
                                    </Card.Header>

                                    <Card.Body className="px-0 py-2">
                                        {loadingData ? (
                                            <div className="text-center py-5 my-4">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="text-muted mt-3 mb-0">Calculando agrupamientos y visualizaciones estadísticas...</p>
                                            </div>
                                        ) : (!dashboardData || ((!dashboardData.charts || dashboardData.charts.length === 0) && (!dashboardData.series || dashboardData.series.length === 0) && (!dashboardData.flatData || dashboardData.flatData.length === 0))) ? (
                                            <Alert variant="light" className="text-center border py-5 my-2 rounded-3">
                                                <FaInfoCircle className="text-secondary fs-3 mb-3" />
                                                <h6 className="fw-bold text-dark">No hay datos disponibles para graficar</h6>
                                                <p className="text-muted small mb-0 max-w-md mx-auto">
                                                    Los filtros actuales no devuelven registros, o el indicador seleccionado aún no tiene datos cargados.
                                                </p>
                                            </Alert>
                                        ) : (
                                            <DashboardCharts dashboardData={dashboardData} />
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
