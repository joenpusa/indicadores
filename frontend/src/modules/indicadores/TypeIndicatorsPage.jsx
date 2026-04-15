import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Card } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';

const TypeIndicatorsPage = () => {
    let { tipo } = useParams();
    const navigate = useNavigate();

    // Fix potential url encodings for display
    tipo = decodeURIComponent(tipo);

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <PublicNavbar />
            
            <Container className="py-5 flex-grow-1">
                <div className="d-flex align-items-center mb-5">
                    <Button variant="outline-secondary" className="me-3 rounded-circle d-flex p-2" onClick={() => navigate('/')}>
                        <FaArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 className="mb-0 text-capitalize fw-bold">Indicadores de <span className="text-primary">{tipo}</span></h2>
                        <small className="text-muted fs-6">Directorio de indicadores clasificados por categoría</small>
                    </div>
                </div>

                <Card className="shadow-sm border-0 border-top border-primary border-4 p-5 text-center bg-white rounded-4">
                    <Card.Body className="py-5">
                        <div className="mb-4">
                            <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex justify-content-center align-items-center" style={{ width: '100px', height: '100px' }}>
                                <span className="fs-1 text-primary">⚙️</span>
                            </div>
                        </div>
                        <h3 className="fw-bold text-secondary mb-3">Sección en Construcción</h3>
                        <p className="text-muted fs-5 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                            A futuro, aquí se visualizarán detalladamente todos los indicadores registrados bajo el tipo <strong>"{tipo}"</strong>.
                        </p>
                        <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                            Esta vista permitirá monitorear, gestionar y generar reportes específicos para esta categoría desde el entorno público.
                        </p>
                    </Card.Body>
                </Card>
            </Container>

            <PublicFooter />
        </div>
    );
};

export default TypeIndicatorsPage;
