import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
    const location = useLocation();
    const isMainPage = location.pathname === '/main';

    return (
        <>
            {!isMainPage && <Sidebar />}
            <main className={isMainPage ? '' : 'main-content-with-bg'} style={{
                flex: 1,
                marginLeft: isMainPage ? 0 : '260px',
                padding: isMainPage ? 0 : '2rem 3rem'
            }}>
                <Outlet />
            </main>
        </>
    );
};

export default MainLayout;