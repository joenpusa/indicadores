import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PublicNavbar = () => {
    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">
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
    );
};

export default PublicNavbar;
