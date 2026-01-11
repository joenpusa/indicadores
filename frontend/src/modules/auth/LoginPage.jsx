import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

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
        <div className="d-flex vh-100 overflow-hidden">
            <style>
                {`
                    .login-bg-column {
                        background-image: url('/src/assets/img/login-bg.png');
                        background-size: cover;
                        background-position: center;
                        position: relative;
                    }
                    .login-bg-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(13, 110, 253, 0.2); /* Slight blue overlay */
                    }
                    .login-form-column {
                        background-color: #ffffff;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between; /* Space between header/form and footer */
                    }
                    .login-logo {
                        max-width: 150px;
                        margin-bottom: 2rem;
                    }
                `}
            </style>

            {/* Left Column - Image */}
            <div className="col-md-7 d-none d-md-block login-bg-column">
                <div className="login-bg-overlay"></div>
            </div>

            {/* Right Column - Form */}
            <div className="col-12 col-md-5 login-form-column p-5 shadow-lg">
                <div className="flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="text-center">
                        <img src="/src/assets/img/logo.png" alt="Logo" className="login-logo img-fluid" />
                        <h2 className="fw-bold mb-4 text-primary">Indicadores</h2>
                        <h4 className="text-muted mb-5">Iniciar Sesión</h4>
                    </div>

                    <Form onSubmit={handleSubmit} className="px-md-4">
                        <div className="form-floating mb-3">
                            <Form.Control
                                type="email"
                                id="floatingEmail"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingEmail">Correo Electrónico</label>
                        </div>
                        <div className="form-floating mb-4">
                            <Form.Control
                                type="password"
                                id="floatingPassword"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingPassword">Contraseña</label>
                        </div>
                        <div className="d-grid gap-2">
                            <Button variant="primary" size="lg" type="submit" className="mb-3">
                                Ingresar
                            </Button>
                            <Button variant="link" className="text-decoration-none text-muted" onClick={() => navigate('/')}>
                                Volver al Inicio
                            </Button>
                        </div>
                    </Form>
                </div>

                {/* Footer */}
                <div className="text-center text-muted small mt-4">
                    <p className="mb-0">&copy; {new Date().getFullYear()} Gobernación. Todos los derechos reservados.</p>
                    <p>Versión 1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
