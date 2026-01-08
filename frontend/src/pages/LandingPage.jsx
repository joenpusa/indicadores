import React from 'react';
import { Navbar, Container, Nav, Carousel, Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaChartBar, FaMapMarkedAlt, FaCity, FaBuilding, FaUsers, FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa';
import { ProgressBar } from 'react-bootstrap';

const LandingPage = () => {
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
                    <div style={{ height: '400px', backgroundColor: '#777' }} className="d-flex align-items-center justify-content-center text-white">
                        <h3>Análisis de Datos</h3>
                    </div>
                </Carousel.Item>
                <Carousel.Item>
                    <div style={{ height: '400px', backgroundColor: '#555' }} className="d-flex align-items-center justify-content-center text-white">
                        <h3>Gestión Territorial</h3>
                    </div>
                </Carousel.Item>
                <Carousel.Item>
                    <div style={{ height: '400px', backgroundColor: '#333' }} className="d-flex align-items-center justify-content-center text-white">
                        <h3>Toma de Decisiones</h3>
                    </div>
                </Carousel.Item>
            </Carousel>

            {/* Cards Section */}
            <Container className="my-5 flex-grow-1">
                <h2 className="text-center mb-4">Nuestros Indicadores</h2>
                <Row xs={1} md={2} lg={3} xl={5} className="g-4">
                    {[
                        { title: "Población", icon: <FaUsers />, value: "1.2M", percent: 85, color: "primary" },
                        { title: "Municipios", icon: <FaCity />, value: "125", percent: 100, color: "success" },
                        { title: "Secretarías", icon: <FaBuilding />, value: "15", percent: 90, color: "info" },
                        { title: "Proyectos", icon: <FaChartBar />, value: "450", percent: 75, color: "warning" },
                        { title: "Cobertura", icon: <FaMapMarkedAlt />, value: "98%", percent: 98, color: "danger" },
                    ].map((item, idx) => (
                        <Col key={idx}>
                            <Card className="h-100 text-center shadow-sm hover-card border-0">
                                <Card.Body>
                                    <div className={`fs-1 text-${item.color} mb-3 icon-container`}>{item.icon}</div>
                                    <Card.Title className="mb-3">{item.title}</Card.Title>
                                    <Card.Text className="fs-4 fw-bold mb-2">{item.value}</Card.Text>
                                    <div className="mt-3">
                                        <small className="text-muted d-block mb-1">Avance</small>
                                        <ProgressBar
                                            now={item.percent}
                                            variant={item.color}
                                            style={{ height: '8px' }}
                                            animated
                                        />
                                    </div>
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
