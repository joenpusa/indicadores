import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="d-flex">
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            <div className="d-flex flex-column flex-grow-1" style={{ height: '100vh', overflow: 'hidden' }}>
                <Navbar toggleSidebar={toggleSidebar} isCollapsed={isSidebarCollapsed} />
                <div id="main-content" className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
