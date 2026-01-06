import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4" style={{ height: '100vh', overflowY: 'auto' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;
