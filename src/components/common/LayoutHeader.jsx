import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
import { getUserProfile } from '../../api/user';
import { logout } from '../../api/auth';
import './LayoutHeader.css';

const LayoutHeader = ({ onShowTutorial }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // Determine compact mode internally to guarantee correct state
    // 예약 및 리포트 페이지에서도 프로필 위젯 절대 좌표 고정(스크롤 안 따라옴) 위해 compact 모드 적용
    const isCompact = location.pathname.startsWith('/conversation') || location.pathname.includes('/tutoring') || location.pathname.startsWith('/report');

    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userData = await getUserProfile();
                setUser(userData);
            } catch (err) {
                console.error('Failed to load profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        if (!window.confirm('로그아웃 하시겠습니까?')) return;
        try {
            await logout();
        } catch (err) {
            console.error('Logout failed', err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate('/login');
        }
    };

    if (isCompact) {
        return (
            <div style={{
                position: 'absolute', // Fixed -> Absolute (Scrolls away)
                top: '60px',   // Moved down from 20px
                right: '120px', // Moved left from 30px
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                pointerEvents: 'none'
            }}>
                <div
                    className="layout-header__profile-widget"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        position: 'relative' // Override CSS fixed position to keep flow
                    }}
                >
                    <div className="layout-header__profile-circle" style={{
                        width: '48px',
                        height: '48px',
                        background: '#d6c9a2',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img src={rmi} alt="Profile" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center top',
                            transform: 'scale(1) translateX(-3%)',
                            display: 'block',
                            backgroundColor: '#9ca2a5'
                        }} />
                    </div>
                    {user && <span className="layout-header__username" style={{
                        fontSize: '0.85rem',
                        color: '#4a3b32',
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                    }}>{user.nickname}님</span>}

                    {isDropdownOpen && (
                        <div
                            className="layout-header__dropdown"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                pointerEvents: 'auto',
                                marginTop: '10px',
                                background: 'rgb(255, 255, 255)',
                                border: '1px solid #f0f0f0',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                width: '150px',
                                overflow: 'hidden',
                                position: 'absolute',
                                top: '100%',
                                right: '0'
                            }}
                        >
                            <div className="layout-header__dropdown-item" onClick={() => navigate('/profile')} style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#333', cursor: 'pointer', fontWeight: 500 }}>
                                마이페이지
                            </div>
                            <div className="layout-header__dropdown-item" onClick={() => {
                                setIsDropdownOpen(false);
                                onShowTutorial();
                            }} style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#333', cursor: 'pointer', fontWeight: 500 }}>
                                튜토리얼
                            </div>
                            <div className="layout-header__dropdown-item logout" onClick={handleLogout} style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#d32f2f', cursor: 'pointer', fontWeight: 500, borderTop: '1px solid #f5f5f5' }}>
                                로그아웃
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <header className="layout-header">
            <div className="layout-header__left">
                {/* Empty for now, can be used for back button if needed */}
            </div>

            <div className="layout-header__center">
                {/* Welcome message removed */}
            </div>

            <div className="layout-header__right">
                <div
                    className="layout-header__profile-widget"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <div className="layout-header__profile-circle">
                        <img src={rmi} alt="Profile" />
                    </div>
                    {user && <span className="layout-header__username">{user.nickname}님</span>}

                    {isDropdownOpen && (
                        <div className="layout-header__dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="layout-header__dropdown-item" onClick={() => navigate('/profile')}>
                                마이페이지
                            </div>
                            <div className="layout-header__dropdown-item" onClick={() => {
                                setIsDropdownOpen(false);
                                onShowTutorial();
                            }}>
                                튜토리얼
                            </div>
                            <div className="layout-header__dropdown-item logout" onClick={handleLogout}>
                                로그아웃
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default LayoutHeader;
