import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import home from '../../assets/img/home.png';
import homeRmi from '../../assets/img/home_rmi.png';
import './MainPageHome.css';
import OnboardingModal from '../common/OnboardingModal';
import { getUserProfile, completeOnboarding } from '../../api/user';
import { logout } from '../../api/auth';

const MainPage = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [headerMoved, setHeaderMoved] = useState(false); // New state for animation

    const userRole = localStorage.getItem('userRole') || 'USER';

    useEffect(() => {
        // Trigger animation after 1.5s
        const timer = setTimeout(() => {
            setHeaderMoved(true);
        }, 1500);

        const checkOnboarding = (userData) => {
            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            const storageKey = `onboardingCompleted_${userRole}_${loggedInEmail}`;
            const localStatus = localStorage.getItem(storageKey);

            // 1. If locally marked as done, trust it
            if (localStatus === 'true') {
                return;
            }

            // 2. If backend data is available, check it
            if (userData) {
                // Check common field names for tutorial status
                const isDone = userData.tutorialYn === 'Y' || userData.tutorialCompleted === true;
                if (isDone) {
                    // Sync local
                    localStorage.setItem(storageKey, 'true');
                    return;
                }
            }

            // 3. If we get here, show onboarding (New User or not synced)
            setShowOnboarding(true);
        };

        const fetchProfile = async () => {
            try {
                const userData = await getUserProfile();
                setUserName(userData?.nickname || '');
                // Pass userData to checkOnboarding
                checkOnboarding(userData);
            } catch (err) {
                console.error('메인 프로필 로딩 실패', err);
                // Fallback check without backend data
                checkOnboarding(null);
            }
        };

        fetchProfile();

        return () => clearTimeout(timer);
    }, [userRole]);

    const handleLogout = async () => {
        if (!window.confirm('로그아웃 하시겠습니까?')) return;

        try {
            await logout();
        } catch (err) {
            console.error('로그아웃 API 요청 실패', err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate('/login');
        }
    };

    const handleOnboardingComplete = async () => {
        try {
            await completeOnboarding();
            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            localStorage.setItem(`onboardingCompleted_${userRole}_${loggedInEmail}`, 'true');
            setShowOnboarding(false);
            alert('환영합니다! 이제 모든 기능을 사용할 수 있어요.');
        } catch (err) {
            console.error('온보딩 처리 실패', err);
            setShowOnboarding(false);
        }
    };

    const allMenuItems = [
        { label: '학습하기', route: '/learning', roles: ['USER'] },
        { label: '회화연습', route: '/conversation', roles: ['USER'] },
        { label: '리포트', route: '/report', roles: ['USER', 'TUTOR'] },
        { label: '튜터링', route: '/tutoring', roles: ['USER', 'TUTOR'] },
        { label: '일정 관리', route: '/schedule', roles: ['TUTOR'] },
        { label: '프로필', route: '/profile', roles: ['USER', 'TUTOR'] }
    ];

    // 현재 사용자 역할에 맞는 메뉴만 필터링
    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <div className="main-home">
            <div className="main-home__overlay" />

            {/* Header moved outside content to be relative to screen */}
            <header className={`main-home__headline ${headerMoved ? 'headline-moved' : ''}`}>
                <h1 className="main-home__title">
                    {userName ? `${userName}님, ` : ''}바르미 마을 입주를 환영합니다!
                </h1>
                <p className="main-home__subtitle">미어캣을 불러 학습을 시작해보세요.</p>
            </header>

            <div className="main-home__content">
                <section className={`main-home__menu ${headerMoved ? 'menu-visible' : ''}`}>
                    {menuItems.map((item, index) => (
                        <button
                            key={item.label}
                            className="main-home__menu-item"
                            onClick={() => navigate(item.route)}
                            onMouseEnter={() => setHoveredItem(item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                            type="button"
                        >
                            <div className="main-home__menu-mascot">
                                <img
                                    src={hoveredItem === item.label ? homeRmi : home}
                                    alt="마스코트"
                                />
                            </div>
                            <span className="main-home__menu-label">{item.label}</span>
                        </button>
                    ))}
                </section>
            </div>

            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    role={userRole}
                />
            )}

            <button className="main-home__logout" onClick={handleLogout} title="로그아웃">
                로그아웃
            </button>
        </div>
    );
};

export default MainPage;