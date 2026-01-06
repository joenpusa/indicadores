import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px', height: '100vh' }}>
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4">Indicadores</span>
            </a>
            <hr />
            <Nav className="flex-column mb-auto">
                <Nav.Item>
                    <NavLink to="/" className="nav-link text-white" end>
                        <FaHome className="me-2" /> Dashboard
                    </NavLink>
                </Nav.Item>
                <Nav.Item>
                    <NavLink to="/users" className="nav-link text-white">
                        <FaUsers className="me-2" /> Usuarios
                    </NavLink>
                </Nav.Item>
                <Nav.Item>
                    <NavLink to="/settings" className="nav-link text-white">
                        <FaCog className="me-2" /> Configuración
                    </NavLink>
                </Nav.Item>
            </Nav>
            <hr />
            <div className="dropdown">
                <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false" onClick={(e) => { e.preventDefault(); logout(); }}>
                    <FaSignOutAlt className="me-2" /> Salir
                </a>
            </div>
        </div>
    );
};

export default Sidebar;
