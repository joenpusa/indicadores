import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';

const PublicFooter = () => {
    return (
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
    );
};

export default PublicFooter;
