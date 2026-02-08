import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import LayoutHeader from './LayoutHeader';
import OnboardingModal from './OnboardingModal'; // Import Modal
import './MainLayout.css';

const MainLayout = () => {
    const location = useLocation();
    const isMainPage = location.pathname === '/main';
    const [showOnboarding, setShowOnboarding] = useState(false); // State lifted

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    return (
        <>
            <div className="main-background" />
            <div className={isMainPage ? '' : 'main-layout-bg'}>
                {!isMainPage && <Sidebar />}
                <main style={{
                    flex: 1,
                    marginLeft: isMainPage ? 0 : '260px',
                    padding: isMainPage ? 0 : '50px 3rem 2rem' /* Precise alignment: 80px(Pad) + 48px(Logo) + 40px(Margin) = 168px */
                }}>
                    {!isMainPage && <LayoutHeader
                        onShowTutorial={() => setShowOnboarding(true)}
                        compact={location.pathname === '/conversation' || location.pathname.startsWith('/conversation/')}
                    />}
                    <div key={location.pathname} className="page-transition">
                        <Outlet />
                    </div>
                </main>
            </div>
            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    role={localStorage.getItem('userRole') || 'USER'}
                />
            )}
        </>
    );
};

export default MainLayout;