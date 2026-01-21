import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, FormControl, InputGroup, Card, Badge, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaSearch, FaEdit, FaDatabase, FaChartBar, FaFilter, FaInfoCircle, FaUpload, FaTable } from 'react-icons/fa';
import indicadoresService from '../../services/indicadoresService';
import IndicadorForm from './components/IndicadorForm';

const IndicadoresPage = () => {
    const navigate = useNavigate();
    const [indicadores, setIndicadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, active, inactive
    const [showModal, setShowModal] = useState(false);
    const [selectedIndicador, setSelectedIndicador] = useState(null);

    useEffect(() => {
        fetchIndicadores();
    }, []);

    const fetchIndicadores = async () => {
        setLoading(true);
        try {
            const data = await indicadoresService.getAll();
            setIndicadores(data.data || []);
        } catch (error) {
            console.error("Error fetching indicadores:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedIndicador(null);
        setShowModal(true);
    };

    const handleEdit = (indicador) => {
        setSelectedIndicador(indicador);
        setShowModal(true);
    };

    const handleSuccess = () => {
        setShowModal(false);
        fetchIndicadores();
    };

    const filteredIndicadores = indicadores.filter(ind => {
        const matchesSearch = ind.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ind.nombre_secretaria && ind.nombre_secretaria.toLowerCase().includes(searchTerm.toLowerCase()));

        if (activeFilter === 'active') return matchesSearch && ind.es_activo === 1;
        if (activeFilter === 'inactive') return matchesSearch && ind.es_activo === 0;
        return matchesSearch;
    });

    return (
        <div className="container-fluid">
            <style>
                {`
                    .indicador-card {
                        transition: all 0.3s ease;
                        border-left: 5px solid #6c757d;
                    }
                    .indicador-card.active {
                        border-left-color: #198754; /* Success green */
                    }
                    .indicador-card.inactive {
                        border-left-color: #dc3545; /* Danger red */
                    }
                    .indicador-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                    }
                `}
            </style>

            <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-center gap-2">
                    <FaInfoCircle size={20} />
                    <strong>¿Qué es un indicador?</strong>
                </div>
                <hr className="my-2" />
                <p className="mb-0">
                    Un indicador agrupa datos que se miden por municipio y periodo.
                    Antes de cargar datos debes definir las variables que lo componen.
                </p>
            </Alert>

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Indicadores</h2>
                <Button variant="primary" onClick={handleCreate}>
                    <FaPlus className="me-2" /> Nuevo Indicador
                </Button>
            </div>

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-6">
                            <InputGroup>
                                <InputGroup.Text className="bg-white"><FaSearch className="text-muted" /></InputGroup.Text>
                                <FormControl
                                    placeholder="Buscar por nombre o secretaría..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="col-md-6 d-flex gap-2 justify-content-md-end">
                            <Button
                                variant={activeFilter === 'all' ? 'secondary' : 'light'}
                                onClick={() => setActiveFilter('all')}
                                size="sm"
                            >
                                Todos
                            </Button>
                            <Button
                                variant={activeFilter === 'active' ? 'success' : 'light'}
                                onClick={() => setActiveFilter('active')}
                                size="sm"
                            >
                                Activos
                            </Button>
                            <Button
                                variant={activeFilter === 'inactive' ? 'danger' : 'light'}
                                onClick={() => setActiveFilter('inactive')}
                                size="sm"
                            >
                                Inactivos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <div className="row g-4">
                    {filteredIndicadores.map((indicador) => (
                        <div key={indicador.id_indicador} className="col-md-6 col-lg-4">
                            <div className={`card h-100 shadow-sm border-0 indicador-card ${indicador.es_activo ? 'active' : 'inactive'}`}>
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <Badge bg={indicador.es_activo ? 'success' : 'danger'} className="mb-2">
                                                {indicador.es_activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                            <h5 className="card-title fw-bold text-dark">{indicador.nombre}</h5>
                                            <div className="text-muted small mb-2">{indicador.nombre_secretaria}</div>
                                        </div>
                                    </div>

                                    <p className="card-text text-secondary mb-4 flex-grow-1">
                                        {indicador.descripcion || <i>Sin descripción</i>}
                                    </p>

                                    <div className="d-flex justify-content-between pt-3 border-top">
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Editar Indicador</Tooltip>}>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(indicador)}>
                                                <FaEdit />
                                            </Button>
                                        </OverlayTrigger>

                                        <div className="d-flex gap-2">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Gestionar Variables</Tooltip>}>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => navigate(`/dashboard/indicadores/${indicador.id_indicador}/variables`)}
                                                >
                                                    <FaDatabase />
                                                </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Ver Datos</Tooltip>}>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => navigate(`/dashboard/indicadores/${indicador.id_indicador}/data`)}
                                                >
                                                    <FaTable />
                                                </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Configurar Visualización</Tooltip>}>
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() => navigate(`/dashboard/indicadores/${indicador.id_indicador}/visualizacion`)}
                                                >
                                                    <FaChartBar />
                                                </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Cargar Datos</Tooltip>}>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => navigate(`/dashboard/indicadores/${indicador.id_indicador}/carga`)}
                                                >
                                                    <FaUpload />
                                                </Button>
                                            </OverlayTrigger>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredIndicadores.length === 0 && (
                <div className="text-center py-5">
                    <div className="mb-3">
                        <FaDatabase size={48} className="text-muted opacity-50" />
                    </div>
                    <h4>Aún no tienes indicadores creados.</h4>
                    <p className="text-muted">Crea un indicador para comenzar a registrar y analizar información.</p>
                    <Button variant="primary" onClick={handleCreate} className="mt-2">
                        <FaPlus className="me-2" /> Crear primer indicador
                    </Button>
                </div>
            )}

            {showModal && (
                <IndicadorForm
                    show={showModal}
                    indicador={selectedIndicador}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};



export default IndicadoresPage;
