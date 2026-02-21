import DashboardCharts from '@/components/DashboardCharts';
import indicadoresService from '@/services/indicadoresService';
import dashboardService from '@/services/dashboardService';
import React, { useState, useEffect } from 'react';
import { Button, Card, Carousel, Col, Container, Nav, Navbar, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { FaBuilding, FaChartBar, FaCity, FaFacebook, FaInstagram, FaMapMarkedAlt, FaTwitter, FaUsers, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import NorteSantanderMap from '@/components/NorteSantanderMap';

const LandingPage = () => {
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
            {/* Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="#">
                        <FaMapMarkedAlt className="me-2" />
                        Indicadores
                    </Navbar.Brand>
                    <Nav className="ms-auto">
                        <Link to="/login">
                            <Button variant="outline-light">Iniciar Sesión</Button>
                        </Link>
                    </Nav>
                </Container>
            </Navbar>

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

            {/* Footer */}
            <footer className="bg-dark text-white py-5 mt-auto">
                <Container>
                    <Row>
                        <Col md={4} className="d-flex align-items-center justify-content-center mb-4 mb-md-0">
                            <img
                                src="https://www.nortedesantander.gov.co/assets/images/Logo_autoridad_footer.jpg"
                                alt="Logo Gobernación"
                                className="img-fluid"
                                style={{ maxHeight: '150px' }}
                            />
                        </Col>
                        <Col md={4} className="mb-4 mb-md-0">
                            <h5>Gobernación de Norte de Santander</h5>
                            <p className="small mb-1"><strong>Sede principal</strong></p>
                            <p className="small mb-1">Dirección: Avenida 5 esquina entre Calle 13 y 14, Cúcuta, Norte de Santander.</p>
                            <p className="small mb-1">Código Postal: 540001.</p>
                            <p className="small mb-1">Horario de atención: Lunes a Viernes de 7:30 a.m a 11:30 a.m. y 2:00 p.m. a 5:30 p.m.</p>
                            <p className="small mb-1">Horario de atención (Unidad de Correspondencia): Lunes a Viernes de 7:30 a.m a 11:00 a.m. y 2:00 p.m. a 5:00 p.m.</p>
                            <p className="small mb-1">Teléfono conmutador: +57 (607) 5956200.</p>
                            <p className="small mb-1">Línea gratuita: 018000185783.</p>
                            <p className="small mb-1">Línea anticorrupción: +57 (607) 5915060.</p>
                            <p className="small mb-1">Línea PQRSD: +57 (607) 5915091.</p>
                            <p className="small mb-1">Correo institucional: gobernacion@nortedesantander.gov.co.</p>
                            <p className="small mb-1">Correo de notificaciones judiciales: secjuridica@nortedesantander.gov.co.</p>
                        </Col>
                        <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
                            <h5 className="mb-3">Síguenos</h5>
                            <div className="d-flex gap-3">
                                <a href="https://www.instagram.com/gobernorte" target="_blank" rel="noopener noreferrer" className="text-white fs-2">
                                    <FaInstagram />
                                </a>
                                <a href="https://www.facebook.com/GobernaciondeNortedeSantander" target="_blank" rel="noopener noreferrer" className="text-white fs-2">
                                    <FaFacebook />
                                </a>
                                <a href="https://twitter.com/GoberNorte" target="_blank" rel="noopener noreferrer" className="text-white fs-2">
                                    <FaTwitter />
                                </a>
                                <a href="https://www.youtube.com/c/Gobernaci%C3%B3nNortedeSantander" target="_blank" rel="noopener noreferrer" className="text-white fs-2">
                                    <FaYoutube />
                                </a>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mt-4 pt-3 border-top border-secondary text-center">
                        <Col>
                            <p className="mb-0 small">&copy; {new Date().getFullYear()} Indicadores. Todos los derechos reservados.</p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
};

export default LandingPage;
