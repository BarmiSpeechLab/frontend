import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
import './MainPage.css';
import OnboardingModal from '../common/OnboardingModal';
import { completeOnboarding, getUserProfile } from '../../api/user'; // /api/users/onboarding
import { logout } from '../../api/auth';

const MainPage = () => {
    const navigate = useNavigate();
    const [lastStudy, setLastStudy] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const mascotImg = rmi;

    useEffect(() => {
        const checkOnboarding = () => {
            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            const userRole = localStorage.getItem('userRole') || 'USER'; // 역할 확인

            // 역할별 완료 상태 키 분리
            const storageKey = `onboardingCompleted_${userRole}_${loggedInEmail}`;
            const status = localStorage.getItem(storageKey);

            if (status !== 'true') {
                setShowOnboarding(true);
            }
        };

        checkOnboarding();

        const fetchData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // 토큰 기반 프로필 정보 가져오기
                const userData = await getUserProfile();
                setUser({
                    nickname: userData.nickname,
                    email: userData.email,
                    role: userData.role // 역할 정보도 설정
                });

                // 역할 정보 로컬스토리지 최신화 (혹시 모르니까)
                localStorage.setItem('userRole', userData.role);

                const saved = localStorage.getItem('lastStudy');
                if (saved) {
                    setLastStudy(JSON.parse(saved));
                }
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
            } catch (err) {
                console.error("로그아웃 API 요청 실패", err);
            } finally {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole'); // 역할 정보 삭제
                navigate('/login');
            }
        }
    };

    const handleCardClick = () => {
        if (lastStudy?.path) {
            navigate(lastStudy.path);
        }
    };

    const handleOnboardingComplete = async () => {
        try {
            await completeOnboarding();

            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            const userRole = localStorage.getItem('userRole') || 'USER';

            // 역할별 완료 상태 저장
            localStorage.setItem(`onboardingCompleted_${userRole}_${loggedInEmail}`, 'true');

            setShowOnboarding(false);
            alert("환영합니다! 이제 모든 기능을 이용하실 수 있습니다.");
        } catch (err) {
            console.error("온보딩 처리 실패", err);
            setShowOnboarding(false);
        }
    };

    return (
        <div className="dashboard-container">
            {/* 상단 헤더 */}
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="mascot-wrapper">
                        <img
                            src={mascotImg}
                            alt="Mascot"
                            className="dashboard-mascot"
                        />
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

            {user?.role === 'TUTOR' ? (
                <>
                    {/* 튜터 전용 - 내 학생 관리 */}
                    <section className="status-section">
                        <h2 className="section-title">내 학생 관리</h2>
                        <div className="status-cards">
                            <div className="status-item-large" style={{ cursor: 'default' }}>
                                <span className="card-label">담당 학생 수</span>
                                <span className="card-value highlight-gold">-명</span>
                                <span className="click-hint">학생 정보 확인</span>
                            </div>
                        </div>
                    </section>

                    {/* 튜터 전용 - 학생 리포트 */}
                    <section className="report-section">
                        <h2 className="section-title">학생 리포트</h2>
                        <div className="placeholder-box">
                        </div>
                    </section>
                </>
            ) : (
                <>
                    {/* 내 학습 현황 */}
                    <section className="status-section">
                        <h2 className="section-title">내 학습 현황</h2>
                        <div className="status-cards">
                            <div
                                className={`status-item-large ${lastStudy ? 'clickable' : ''}`}
                                onClick={handleCardClick}
                                style={{ cursor: lastStudy ? 'pointer' : 'default' }}
                            >
                                <span className="card-label">현재 학습 중</span>
                                <span className="card-value highlight-gold">
                                    {lastStudy ? lastStudy.title : '아직 진행 중인 학습이 없습니다.'}
                                </span>
                                {lastStudy && <span className="click-hint">이어서 학습하기</span>}
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
                </>
            )}

            {/* 온보딩(튜토리얼) */}
            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    role={localStorage.getItem('userRole') || 'USER'} // 역할 전달
                />
            )}
        </div>
    );
};

export default MainPage;