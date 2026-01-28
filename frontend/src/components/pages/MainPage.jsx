import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import rmiImg from '../../assets/img/rmi.png';
import './MainPage.css';
import { getUserProfile } from '../../api/user'; // 나중에 연동 시 주석 해제 피룡
import { logout } from '../../api/auth';

const MainPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 나중에 연동 시 주석 해제 필요
                /*
                const userData = await getUserProfile();
                setUser({
                    nickname: userData.nickname,
                    email: userData.email,
                    role: userData.role
                });
                */

                // 테스트용
                const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
                const userRole = localStorage.getItem('userRole') || 'USER';
                setUser({ nickname: '바르미', email: loggedInEmail, role: userRole });

            } catch (err) {
                console.error("데이터 로딩 실패", err);
            }
        };

        fetchData();
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setIsDropdownOpen(false);
    };

    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            try {
                await logout();
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                navigate('/login');
            } catch (err) {
                console.error("로그아웃 실패", err);
                alert("로그아웃 중 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div className="dashboard-container">
            {/* 상단 헤더 */}
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="mascot-wrapper">
                        <img src={rmiImg} alt="Mascot" className="dashboard-mascot" />
                    </div>
                    <h1 className="welcome-text">
                        {user ? `${user.nickname}님 안녕하세요!` : '안녕하세요!'}
                    </h1>
                </div>
                <div className="header-right">
                    <div className="profile-widget" onClick={toggleDropdown} title="메뉴 열기">
                        <div className="profile-circle-small">
                            {user?.nickname?.charAt(0) || 'B'}
                        </div>
                        <span className="profile-name-small">{user?.nickname || 'Guest'}님</span>
                    </div>
                    {isDropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-item" onClick={handleProfileClick}>
                                내 프로필
                            </div>
                            <div className="dropdown-item logout-item" onClick={handleLogout}>
                                로그아웃
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 내 학습 현황 */}
            <section className="status-section">
                <h2 className="section-title">내 학습 현황</h2>
                <div className="status-cards">
                    <div className="status-card">
                        <span className="card-value highlight-blue">-</span>
                        <span className="card-label">총 학습 시간</span>
                    </div>
                    <div className="status-card">
                        <span className="card-value highlight-blue">-</span>
                        <span className="card-label">완료한 학습</span>
                    </div>
                </div>
            </section>

            {/* 학습 리포트 */}
            <section className="report-section">
                <h2 className="section-title">학습 리포트</h2>
                <div className="placeholder-box">
                    {/* 그래프 영역 */}
                </div>
            </section>

            {/* 취약점 분석 */}
            <section className="analysis-section">
                <h2 className="section-title">취약점 분석</h2>
                <div className="placeholder-box">
                    {/* 진행바 영역 */}
                </div>
            </section>
        </div>
    );
};

export default MainPage;