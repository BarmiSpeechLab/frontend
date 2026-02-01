import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: '200px',
                padding: '2rem 3rem',
                backgroundColor: '#fff'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;