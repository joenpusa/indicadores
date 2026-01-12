import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaCog, FaSignOutAlt, FaMapMarkedAlt, FaAngleDown, FaAngleRight, FaCity, FaBuilding, FaUser, FaUserShield } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { logout } = useAuth();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isUsersOpen, setIsUsersOpen] = useState(false);

    const handleExpand = () => {
        if (isCollapsed && setIsCollapsed) {
            setIsCollapsed(false);
        }
    };

    const toggleConfig = (e) => {
        e.stopPropagation(); // Prevent triggering handleExpand twice if not needed
        handleExpand();
        setIsConfigOpen(!isConfigOpen);
    };

    const toggleUsers = (e) => {
        e.stopPropagation();
        handleExpand();
        setIsUsersOpen(!isUsersOpen);
    };

    const sidebarWidth = isCollapsed ? '80px' : '280px';

    return (
        <div
            className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark transition-all sidebar-container"
            style={{ width: sidebarWidth, height: '100vh', transition: 'width 0.3s' }}
        >
            <div className={`d-flex align-items-center mb-3 mb-md-0 text-white text-decoration-none ${isCollapsed ? 'justify-content-center' : ''}`}>
                <a href="/dashboard" className="d-flex align-items-center text-white text-decoration-none">
                    <FaMapMarkedAlt className={`fs-4 ${isCollapsed ? '' : 'me-2'}`} />
                    {!isCollapsed && <span className="fs-4">Indicadores</span>}
                </a>
            </div>
            <hr />
            <Nav className="flex-column mb-auto">
                <Nav.Item>
                    <NavLink
                        to="/dashboard"
                        className={`nav-link text-white sidebar-link d-flex align-items-center ${isCollapsed ? 'justify-content-center p-2' : ''}`}
                        onClick={handleExpand}
                        end
                    >
                        <FaHome className={`${isCollapsed ? 'fs-4' : 'me-2 fs-5'}`} /> {!isCollapsed && 'Dashboard'}
                    </NavLink>
                </Nav.Item>
                <Nav.Item>
                    <div
                        className={`nav-link text-white sidebar-link d-flex align-items-center justify-content-between ${isCollapsed ? 'justify-content-center p-2' : ''}`}
                        onClick={toggleUsers}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`}>
                            <FaUsers className={`${isCollapsed ? 'fs-4' : 'me-2 fs-5'}`} /> {!isCollapsed && 'Usuarios'}
                        </div>
                        {!isCollapsed && (isUsersOpen ? <FaAngleDown /> : <FaAngleRight />)}
                    </div>
                    {isUsersOpen && !isCollapsed && (
                        <div className="ms-4 mt-1">
                            <NavLink to="/dashboard/users" className="nav-link text-white sidebar-link py-1 d-flex align-items-center">
                                <FaUser className="me-2" /> Usuarios
                            </NavLink>
                            <NavLink to="/dashboard/roles" className="nav-link text-white sidebar-link py-1 d-flex align-items-center">
                                <FaUserShield className="me-2" /> Roles
                            </NavLink>
                        </div>
                    )}
                </Nav.Item>
                <Nav.Item>
                    <div
                        className={`nav-link text-white sidebar-link d-flex align-items-center justify-content-between ${isCollapsed ? 'justify-content-center p-2' : ''}`}
                        onClick={toggleConfig}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`}>
                            <FaCog className={`${isCollapsed ? 'fs-4' : 'me-2 fs-5'}`} /> {!isCollapsed && 'Configuración'}
                        </div>
                        {!isCollapsed && (isConfigOpen ? <FaAngleDown /> : <FaAngleRight />)}
                    </div>
                    {isConfigOpen && !isCollapsed && (
                        <div className="ms-4 mt-1">
                            <NavLink to="/dashboard/settings/municipios" className="nav-link text-white sidebar-link py-1 d-flex align-items-center">
                                <FaCity className="me-2" /> Municipios
                            </NavLink>
                            <NavLink to="/dashboard/settings/secretarias" className="nav-link text-white sidebar-link py-1 d-flex align-items-center">
                                <FaBuilding className="me-2" /> Secretarías
                            </NavLink>
                        </div>
                    )}
                </Nav.Item>
            </Nav>
            <hr />
            <div>
                <a
                    href="#"
                    className={`d-flex align-items-center text-white text-decoration-none sidebar-link p-2 ${isCollapsed ? 'justify-content-center' : ''}`}
                    onClick={(e) => { e.preventDefault(); logout(); }}
                >
                    <FaSignOutAlt className={`${isCollapsed ? 'fs-4' : 'me-2 fs-5'}`} /> {!isCollapsed && 'Salir'}
                </a>
            </div>
        </div>
    );
};

export default Sidebar;
