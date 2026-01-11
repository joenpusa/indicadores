import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            success('Inicio de sesión exitoso', 'Bienvenido');
            navigate('/dashboard');
        } catch (err) {
            error(err.response?.data?.message || 'Error al iniciar sesión', 'Error de Autenticación');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
            <Row>
                <Col md={12}>
                    <Card className="p-4 shadow" style={{ width: '400px' }}>
                        <Card.Body>
                            <h2 className="text-center mb-4">Iniciar Sesión</h2>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit">Log In</Button>
                                    <Button variant="outline-secondary" onClick={() => navigate('/')}>
                                        Volver al Inicio
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;
