import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
import './MainPage.css';
import OnboardingModal from '../common/OnboardingModal';
import StudyCalendar from '../common/StudyCalendar';
import WeeklyChart from '../common/WeeklyChart';
import PronunciationWeaknessRadar from '../common/PronunciationWeaknessRadar';
import { completeOnboarding, getUserProfile } from '../../api/user'; // /api/users/onboarding
import { logout } from '../../api/auth';

const MainPage = () => {
    const navigate = useNavigate();
    const [lastStudy, setLastStudy] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [studyCalendarData, setStudyCalendarData] = useState({});
    const [weeklyChartData, setWeeklyChartData] = useState({});
    const [weaknessStats, setWeaknessStats] = useState({});

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

                // Mock 데이터 - 추후 API에서 받아올 데이터
                // 달력 데이터: 날짜별 접속 여부
                const mockCalendarData = {};
                const today = new Date();
                for (let i = 0; i < 365; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    // 50% 확률로 접속한 것처럼 표시
                    mockCalendarData[dateStr] = Math.random() > 0.5;
                }
                setStudyCalendarData(mockCalendarData);

                // Mock 데이터 - 주간 학습 시간 (분 단위)
                const mockWeeklyData = {};
                for (let i = 0; i < 7; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    mockWeeklyData[dateStr] = Math.floor(Math.random() * 120);
                }
                setWeeklyChartData(mockWeeklyData);

                // Mock 데이터 - 취약점 카테고리 오답률/IPA 상세 (추후 API 연동)
                setWeaknessStats({
                    vowel: {
                        wrongCount: 12,
                        totalCount: 40,
                        ipaStats: [
                            { ipa: 'i', wrongCount: 5, totalCount: 14 },
                            { ipa: 'ae', wrongCount: 4, totalCount: 12 },
                            { ipa: 'u', wrongCount: 3, totalCount: 14 }
                        ]
                    },
                    semivowel: {
                        wrongCount: 6,
                        totalCount: 22,
                        ipaStats: [
                            { ipa: 'j', wrongCount: 4, totalCount: 12 },
                            { ipa: 'w', wrongCount: 2, totalCount: 10 }
                        ]
                    },
                    plosive: {
                        wrongCount: 9,
                        totalCount: 28,
                        ipaStats: [
                            { ipa: 't', wrongCount: 4, totalCount: 10 },
                            { ipa: 'k', wrongCount: 3, totalCount: 9 },
                            { ipa: 'p', wrongCount: 2, totalCount: 9 }
                        ]
                    },
                    affricate: {
                        wrongCount: 7,
                        totalCount: 18,
                        ipaStats: [
                            { ipa: 'tʃ', wrongCount: 4, totalCount: 9 },
                            { ipa: 'dʒ', wrongCount: 3, totalCount: 9 }
                        ]
                    },
                    fricative: {
                        wrongCount: 14,
                        totalCount: 30,
                        ipaStats: [
                            { ipa: 's', wrongCount: 5, totalCount: 9 },
                            { ipa: 'z', wrongCount: 4, totalCount: 8 },
                            { ipa: 'f', wrongCount: 3, totalCount: 7 },
                            { ipa: 'v', wrongCount: 2, totalCount: 6 }
                        ]
                    },
                    aspirate: {
                        wrongCount: 6,
                        totalCount: 16,
                        ipaStats: [{ ipa: 'h', wrongCount: 6, totalCount: 16 }]
                    },
                    liquid: {
                        wrongCount: 4,
                        totalCount: 20,
                        ipaStats: [
                            { ipa: 'l', wrongCount: 3, totalCount: 10 },
                            { ipa: 'r', wrongCount: 1, totalCount: 10 }
                        ]
                    },
                    nasal: {
                        wrongCount: 8,
                        totalCount: 26,
                        ipaStats: [
                            { ipa: 'm', wrongCount: 2, totalCount: 8 },
                            { ipa: 'n', wrongCount: 3, totalCount: 9 },
                            { ipa: 'ŋ', wrongCount: 3, totalCount: 9 }
                        ]
                    }
                });
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

                        <div className="report-charts-container">
                            <WeeklyChart weeklyStats={weeklyChartData} />
                            <StudyCalendar studyData={studyCalendarData} />
                        </div>
                    </section>

                    {/* 학습 리포트 */}
                    <section className="report-section">
                        <h2 className="section-title">학습 리포트</h2>
                        <div className="report-cards-container">
                            <PronunciationWeaknessRadar weaknessStats={weaknessStats} />
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
