import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col } from 'react-bootstrap';

const DashboardPage = () => {
    const { user } = useAuth();

    return (
        <div>
            <h2>Bienvenido, {user?.nombre || 'Usuario'}</h2>
            <p>Este es el panel principal de administración.</p>

            <Row className="mt-4">
                <Col md={4}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Usuarios</Card.Title>
                            <Card.Text className="display-4">15</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Card.Title>Ventas Hoy</Card.Title>
                            <Card.Text className="display-4">$1,200</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Card.Title>Alertas</Card.Title>
                            <Card.Text className="display-4">2</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
