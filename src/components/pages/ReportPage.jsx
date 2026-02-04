import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
import './MainPage.css';
import OnboardingModal from '../common/OnboardingModal';
import StudyCalendar from '../common/StudyCalendar';
import WeeklyChart from '../common/WeeklyChart';
import PronunciationWeaknessRadar from '../common/PronunciationWeaknessRadar';
import OverallLearningStats from '../common/OverallLearningStats';
import { completeOnboarding, getCalendarLogs, getIpaRadarStats, getUserProfile, getUserStats } from '../../api/user';
import { logout } from '../../api/auth';

const TYPE_TO_CATEGORY = {
    vowel: 'vowel',
    semivowel: 'semivowel',
    glide: 'semivowel',
    plosive: 'plosive',
    stop: 'plosive',
    affricate: 'affricate',
    fricative: 'fricative',
    aspirate: 'aspirate',
    liquid: 'liquid',
    nasal: 'nasal',
    consonant: 'consonant'
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapCalendarLogsToDailyCount = (logs = []) => {
    const mapped = {};
    logs.forEach((entry) => {
        const date = entry?.date;
        if (!date) return;
        mapped[date] = toNumber(entry?.count);
    });
    return mapped;
};

const mapDailyCountToStudyFlag = (dailyCount = {}) => {
    const mapped = {};
    Object.entries(dailyCount).forEach(([date, count]) => {
        mapped[date] = toNumber(count) > 0;
    });
    return mapped;
};

const mapIpaRadarData = (raw = {}) => {
    // 백엔드에서 온 깨진 한글 키를 정상 한글로 매핑
    const koreanKeyMap = {
        'ë§ˆì°°ìŒ': '마찰음',
        'íŒŒì—­ìŒ': '파열음',
        'ë¹„ìŒ': '비음',
        'ë° ëª¨ìŒ': '반모음',
        'ëª¨ìŒ': '모음',
        'íŒŒì°¾ìŒ': '파찰음',
        'ê¸°ìŒ': '기식음',
        'ìœ ìŒ': '유음'
    };

    const mapped = {};

    Object.entries(raw || {}).forEach(([rawType, symbols]) => {
        // 깨진 키를 정상 한글로 복구
        let normalizedType = koreanKeyMap[rawType] || String(rawType || '').trim().toLowerCase();
        const categoryKey = TYPE_TO_CATEGORY[normalizedType] || normalizedType;
        
        if (!categoryKey || !symbols || typeof symbols !== 'object') return;

        let totalCount = 0;
        let wrongCount = 0;
        const ipaStats = [];

        Object.entries(symbols).forEach(([symbol, stat]) => {
            const totalTryCount = toNumber(stat?.totalTryCount);
            const successCount = toNumber(stat?.successCount);
            const localWrongCount = Math.max(0, totalTryCount - successCount);

            totalCount += totalTryCount;
            wrongCount += localWrongCount;

            ipaStats.push({
                ipa: symbol,
                wrongCount: localWrongCount,
                totalCount: totalTryCount
            });
        });

        mapped[categoryKey] = { wrongCount, totalCount, ipaStats };
    });

    return mapped;
};

const ReportPage = () => {
    const navigate = useNavigate();
    const [lastStudy, setLastStudy] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [studyCalendarData, setStudyCalendarData] = useState({});
    const [studyCountsData, setStudyCountsData] = useState({});
    const [weeklyChartData, setWeeklyChartData] = useState({});
    const [weaknessStats, setWeaknessStats] = useState({});
    const [overallStats, setOverallStats] = useState({
        totalStudyDays: 0,
        totalTryCount: 0,
        averageScore: 0
    });

    useEffect(() => {
        const checkOnboarding = () => {
            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            const userRole = localStorage.getItem('userRole') || 'USER';
            const storageKey = `onboardingCompleted_${userRole}_${loggedInEmail}`;
            const status = localStorage.getItem(storageKey);
            if (status !== 'true') setShowOnboarding(true);
        };

        const fetchData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const userData = await getUserProfile();
                setUser({
                    nickname: userData.nickname,
                    email: userData.email,
                    role: userData.role
                });

                localStorage.setItem('userRole', userData.role);

                const saved = localStorage.getItem('lastStudy');
                if (saved) setLastStudy(JSON.parse(saved));

                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;

                // 최근 7일이 이전 달을 포함하는지 확인
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                const prevMonth = sevenDaysAgo.getMonth() + 1;
                const prevYear = sevenDaysAgo.getFullYear();

                // 두 달에 걸쳐있으면 이전 달 데이터도 가져오기
                const apiCalls = [
                    getCalendarLogs(year, month).catch(() => []),
                    getIpaRadarStats().catch(() => ({})),
                    getUserStats().catch(() => null)
                ];

                if (prevMonth !== month || prevYear !== year) {
                    apiCalls.push(getCalendarLogs(prevYear, prevMonth).catch(() => []));
                }

                const results = await Promise.all(apiCalls);
                const calendarLogs = results[0];
                const ipaStatsRaw = results[1];
                const userStats = results[2];
                const prevMonthLogs = results[3] || [];

                // 현재 달과 이전 달 데이터 합치기
                const allLogs = [...prevMonthLogs, ...calendarLogs];
                const dailyCountMap = mapCalendarLogsToDailyCount(allLogs);
                
                setWeeklyChartData(dailyCountMap);
                setStudyCountsData(dailyCountMap);
                setStudyCalendarData(mapDailyCountToStudyFlag(dailyCountMap));
                setWeaknessStats(mapIpaRadarData(ipaStatsRaw));
                if (userStats) setOverallStats(userStats);
            } catch (err) {
                console.error('리포트 데이터 로딩 실패', err);
            }
        };

        checkOnboarding();
        fetchData();
    }, [navigate]);

    const handleMonthChange = async (year, month) => {
        try {
            const calendarLogs = await getCalendarLogs(year, month);
            const dailyCountMap = mapCalendarLogsToDailyCount(calendarLogs);
            setStudyCountsData(dailyCountMap);
            setStudyCalendarData(mapDailyCountToStudyFlag(dailyCountMap));
        } catch (err) {
            console.error('달력 데이터 로딩 실패', err);
        }
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setIsDropdownOpen(false);
    };

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
            navigate('/login');
        }
    };

    const handleOnboardingComplete = async () => {
        try {
            await completeOnboarding();

            const loggedInEmail = localStorage.getItem('userEmail') || 'guest';
            const userRole = localStorage.getItem('userRole') || 'USER';
            localStorage.setItem(`onboardingCompleted_${userRole}_${loggedInEmail}`, 'true');

            setShowOnboarding(false);
            alert('환영합니다! 이제 모든 기능을 사용할 수 있어요.');
        } catch (err) {
            console.error('온보딩 처리 실패', err);
            setShowOnboarding(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="mascot-wrapper">
                        <img src={rmi} alt="마스코트" className="dashboard-mascot" />
                    </div>
                    <h1 className="welcome-text">
                        {user ? `${user.nickname}님, 안녕하세요!` : '안녕하세요!'}
                    </h1>
                </div>

                <div className="header-right">
                    <div
                        className="profile-widget"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        title="메뉴 열기"
                    >
                        <div className="profile-circle-small">{user?.nickname?.charAt(0) || 'B'}</div>
                        <span className="profile-name-small">{user?.nickname || '사용자'}님</span>
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
                    <section className="status-section">
                        <h2 className="section-title">담당 학생 관리</h2>
                        <div className="status-cards">
                            <div className="status-item-large" style={{ cursor: 'default' }}>
                                <span className="card-label">담당 학생 수</span>
                                <span className="card-value highlight-gold">-명</span>
                                <span className="click-hint">학생 정보 확인</span>
                            </div>
                        </div>
                    </section>

                    <section className="report-section">
                        <h2 className="section-title">학생 리포트</h2>
                        <div className="placeholder-box" />
                    </section>
                </>
            ) : (
                <>
                    <section className="status-section">
                        <h2 className="section-title">내 학습 현황</h2>
                        <div className="report-charts-container">
                            <div className="report-left-column">
                                <OverallLearningStats stats={overallStats} />
                                <WeeklyChart weeklyStats={weeklyChartData} />
                            </div>
                            <StudyCalendar 
                                studyData={studyCalendarData} 
                                studyCounts={studyCountsData}
                                onMonthChange={handleMonthChange}
                            />
                        </div>
                    </section>

                    <section className="report-section">
                        <h2 className="section-title">학습 리포트</h2>
                        <div className="report-cards-container">
                            <PronunciationWeaknessRadar weaknessStats={weaknessStats} />
                        </div>
                    </section>

                    {lastStudy?.path && (
                        <section className="status-section">
                            <div
                                className="status-item-large clickable"
                                onClick={() => navigate(lastStudy.path)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="card-label">최근 학습</span>
                                <span className="card-value highlight-gold">{lastStudy.title}</span>
                                <span className="click-hint">이어서 학습하기</span>
                            </div>
                        </section>
                    )}
                </>
            )}

            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    role={localStorage.getItem('userRole') || 'USER'}
                />
            )}
        </div>
    );
};

export default ReportPage;