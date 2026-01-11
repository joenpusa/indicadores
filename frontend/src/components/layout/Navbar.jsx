import React from 'react';
import { FaBars, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const Navbar = ({ toggleSidebar, isCollapsed }) => {
    const { user } = useAuth();

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom px-3 py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
                <button className="btn btn-link text-dark p-0" onClick={toggleSidebar}>
                    <FaBars className="fs-4" />
                </button>
            </div>

            <div className="d-flex align-items-center">
                <span className="me-2 d-none d-sm-inline">{user ? (user.nombre || user.email) : 'Usuario'}</span>
                <FaUserCircle className="fs-3 text-secondary" />
            </div>
        </nav>
    );
};

export default Navbar;
