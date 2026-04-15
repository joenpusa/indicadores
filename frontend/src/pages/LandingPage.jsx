import DashboardCharts from '@/components/DashboardCharts';
import indicadoresService from '@/services/indicadoresService';
import dashboardService from '@/services/dashboardService';
import React, { useState, useEffect } from 'react';
import { Button, Card, Carousel, Col, Container, Nav, Navbar, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { FaBuilding, FaChartBar, FaCity, FaFacebook, FaInstagram, FaMapMarkedAlt, FaTwitter, FaUsers, FaYoutube } from 'react-icons/fa';
import { Database, Target, Unlock, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import NorteSantanderMap from '@/components/NorteSantanderMap';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';

const LandingPage = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [activeIndicador, setActiveIndicador] = useState(null);
    const [publicMetrics, setPublicMetrics] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await dashboardService.getPublicMetrics();
                setPublicMetrics(data);
            } catch (error) {
                console.error("Error loading public metrics:", error);
            }
        };
        fetchMetrics();
    }, []);

    const handleFilterApplied = async ({ municipioId, indicador, id_periodo, id_variable }) => {
        setActiveIndicador(indicador);
        if (indicador) {
            setLoadingDashboard(true);
            try {
                // If specific period filtering is added later, pass it here
                // For now, fetching total aggregated data or default
                const params = { active: 1 };
                if (municipioId && municipioId !== "todos") {
                    params.id_municipio = municipioId;
                }
                if (id_periodo) {
                    params.id_periodo = id_periodo;
                }
                if (id_variable) {
                    params.id_variable = id_variable;
                }

                const data = await indicadoresService.getDashboardData(indicador.id_indicador, params);
                setDashboardData(data);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
                setDashboardData(null);
            } finally {
                setLoadingDashboard(false);
            }
        } else {
            setDashboardData(null);
            setActiveIndicador(null);
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Custom Styles for Hover Effects */}
            <style>
                {`
                    .hover-card {
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                    .hover-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important;
                    }
                    .hover-card .icon-container {
                        transition: transform 0.3s ease;
                    }
                    .hover-card:hover .icon-container {
                        transform: scale(1.1);
                    }
                    .text-shadow {
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    }
                `}
            </style>
            
            <PublicNavbar />

            {/* Carousel */}
            <Carousel>
                <Carousel.Item>
                    <div style={{ height: '400px', backgroundColor: '#000', position: 'relative' }} className="d-flex align-items-center justify-content-center text-white">
                        <img
                            src="/images/carousel/analisis_datos.png"
                            alt="Análisis de Datos"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, position: 'absolute', top: 0, left: 0 }}
                        />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 className="display-4 fw-bold text-shadow">Análisis de Datos</h3>
                        </div>
                    </div>
                </Carousel.Item>
                <Carousel.Item>
                    <div style={{ height: '400px', backgroundColor: '#000', position: 'relative' }} className="d-flex align-items-center justify-content-center text-white">
                        <img
                            src="/images/carousel/gestion_territorial.png"
                            alt="Gestión Territorial"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, position: 'absolute', top: 0, left: 0 }}
                        />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 className="display-4 fw-bold text-shadow">Gestión Territorial</h3>
                        </div>
                    </div>
                </Carousel.Item>
                <Carousel.Item>
                    <div style={{ height: '400px', backgroundColor: '#000', position: 'relative' }} className="d-flex align-items-center justify-content-center text-white">
                        <img
                            src="/images/carousel/toma_decisiones.png"
                            alt="Toma de Decisiones"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, position: 'absolute', top: 0, left: 0 }}
                        />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 className="display-4 fw-bold text-shadow">Toma de Decisiones</h3>
                        </div>
                    </div>
                </Carousel.Item>
            </Carousel>


            {/* Categorías de Indicadores Section */}
            <Container className="my-5">
                <h2 className="text-center mb-4">Explorar Categorías de Indicadores</h2>
                <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
                    {[
                        { title: 'Disponibilidad', icon: Database, color: 'primary', desc: 'Monitoreo de recursos y suministros disponibles.' },
                        { title: 'Adecuación', icon: Target, color: 'success', desc: 'Evaluación de calidad y pertinencia de los recursos.' },
                        { title: 'Acceso', icon: Unlock, color: 'warning', desc: 'Métricas de distribución y accesibilidad territorial.' },
                        { title: 'Sostenibilidad', icon: Leaf, color: 'info', desc: 'Análisis de impacto y viabilidad a largo plazo.' }
                    ].map((cat, idx) => (
                        <Col key={idx}>
                            <Card
                                className={`h-100 shadow-sm border-0 border-bottom border-${cat.color} border-4 bg-white`}
                                onClick={() => navigate(`/indicadores/tipo/${encodeURIComponent(cat.title)}`)}
                                style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.classList.add('shadow-lg');
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.classList.remove('shadow-lg');
                                }}
                            >
                                <Card.Body className="d-flex flex-column align-items-center text-center p-4">
                                    <div className={`rounded-circle bg-${cat.color} bg-opacity-10 mb-3 d-flex justify-content-center align-items-center`} style={{ width: '70px', height: '70px' }}>
                                        <cat.icon size={32} className={`text-${cat.color}`} />
                                    </div>
                                    <h5 className="fw-bold mb-2 text-dark">{cat.title}</h5>
                                    <p className="text-muted small mb-0">{cat.desc}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>

            {/* Map Section */}
            <NorteSantanderMap
                mapData={dashboardData?.mapData}
                onFilterApplied={handleFilterApplied}
            />

            {/* Dashboard Charts Section */}
            <Container className="mb-5">
                {loadingDashboard ? (
                    <div className="text-center p-5">
                        <Spinner animation="border" variant="primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </Spinner>
                        <p className="mt-2 text-muted">Cargando datos del indicador...</p>
                    </div>
                ) : (
                    activeIndicador && (
                        dashboardData ? (
                            <DashboardCharts charts={dashboardData.charts} />
                        ) : (
                            <div className="text-center text-muted p-4 bg-light rounded">
                                <p>No hay datos disponibles para la visualización de este indicador.</p>
                            </div>
                        )
                    )
                )}
            </Container>

            {/* Cards Section */}
            <Container className="my-5 flex-grow-1">
                <h2 className="text-center mb-4">Nuestros Indicadores</h2>
                <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
                    {[
                        { title: "Municipios", icon: <FaCity />, value: publicMetrics?.totalMunicipios || "-", color: "success" },
                        { title: "Secretarías", icon: <FaBuilding />, value: publicMetrics?.totalSecretarias || "-", color: "info" },
                        { title: "Indicadores", icon: <FaChartBar />, value: publicMetrics?.totalIndicadores || "-", color: "warning" },
                        { title: "Variables", icon: <FaMapMarkedAlt />, value: publicMetrics?.totalVariables || "-", color: "danger" },
                    ].map((item, idx) => (
                        <Col key={idx}>
                            <Card className="h-100 text-center shadow-sm hover-card border-0">
                                <Card.Body>
                                    <div className={`fs-1 text-${item.color} mb-3 icon-container`}>{item.icon}</div>
                                    <Card.Title className="mb-3">{item.title}</Card.Title>
                                    <Card.Text className="fs-4 fw-bold mb-2">{
                                        publicMetrics ? item.value : <Spinner animation="border" size="sm" variant={item.color} />
                                    }</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>

            <PublicFooter />
        </div>
    );
};

export default LandingPage;
