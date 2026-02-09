import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
import './ReportPage.css';
import OnboardingModal from '../common/OnboardingModal';
import StudyCalendar from '../common/StudyCalendar';
import WeeklyChart from '../common/WeeklyChart';
import PronunciationWeaknessRadar from '../common/PronunciationWeaknessRadar';
import AiFeedback from '../common/AiFeedback';
import OverallLearningStats from '../common/OverallLearningStats';
import { completeOnboarding, getCalendarLogs, getIpaAiReport, getIpaRadarStats, getUserProfile, getUserStats } from '../../api/user';
import { logout } from '../../api/auth';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import api from '../../api/index';
import ReportModal from '../common/ReportModal';

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
    const containerRef = useScrollAnimation();
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

    // 튜터 전용 상태
    const [myStudents, setMyStudents] = useState([]);
    const [activeReportStudent, setActiveReportStudent] = useState(null);
    const [activeReportStats, setActiveReportStats] = useState({});
    const [activeReportAi, setActiveReportAi] = useState('');
    const [activeReportLoading, setActiveReportLoading] = useState(false);

    const [reportStudentId, setReportStudentId] = useState(null);
    const [reportStudentNickname, setReportStudentNickname] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
                    id: userData.id,
                    nickname: userData.nickname,
                    email: userData.email,
                    role: userData.role
                });

                if (userData.id) localStorage.setItem('userId', userData.id);
                localStorage.setItem('userRole', userData.role);
                if (userData.nickname) localStorage.setItem('userNickname', userData.nickname);

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

                // ✅ 이전 달 데이터 먼저 조회 (조건부)
                let prevMonthLogs = [];
                if (prevMonth !== month || prevYear !== year) {
                    prevMonthLogs = await getCalendarLogs(prevYear, prevMonth).catch(() => []);
                }

                // ✅ 현재 달 데이터 병렬 조회
                const [calendarLogs, ipaStatsRaw, userStats] = await Promise.all([
                    getCalendarLogs(year, month).catch(() => []),
                    getIpaRadarStats().catch(() => ({})),
                    getUserStats().catch(() => null)
                ]);

                // 튜터일 경우 담당 학생 목록(예약 목록) 가져오기
                if (userData.role === 'TUTOR') {
                    try {
                        const res = await api.get('/meetings/tutor-meetings');
                        const serverData = res.data.data || [];

                        // 예약 정보가 포함된 목록으로 가공
                        const processedData = serverData
                            .filter(appt => appt.tuteeId) // 예약된 건만
                            .map(appt => ({
                                id: appt.id,
                                tuteeId: appt.tuteeId,
                                nickname: appt.tuteeNickname || '익명 학생',
                                datetime: appt.datetime || appt.date || appt.scheduledAt
                            }))
                            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

                        setMyStudents(processedData);

                        // ✅ 첫 번째 학생 자동 선택
                        if (processedData.length > 0) {
                            handleSelectStudent(processedData[0]);
                        }
                    } catch (error) {
                        console.error('담당 학생 목록 로드 실패', error);
                    }
                }

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

    const handleSelectStudent = async (student) => {
        if (!student || activeReportStudent?.id === student.id) return;

        setActiveReportStudent(student);
        setActiveReportLoading(true);

        try {
            // 레이더 차트 + AI 리포트 동시 호출
            const [statsRaw, aiReportRaw] = await Promise.all([
                getIpaRadarStats(student.tuteeId),
                getIpaAiReport(student.tuteeId)
            ]);

            setActiveReportStats(mapIpaRadarData(statsRaw));
            setActiveReportAi(aiReportRaw);
        } catch (error) {
            console.error('학생 리포트 상세 로드 실패', error);
            setActiveReportAi('리포트를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setActiveReportLoading(false);
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

    const openReportModal = (studentId, studentNickname) => {
        setReportStudentId(studentId);
        setReportStudentNickname(studentNickname);
        setIsReportModalOpen(true);
    };

    return (
        <div className="dashboard-container" ref={containerRef}>
            {/* Header removed as per request */}

            {user?.role === 'TUTOR' ? (
                <>
                    <div className="report-group anim-target delay-1">
                        <h2 className="section-title">담당 학생 관리</h2>
                        <section className="status-section-card">
                            <div className="status-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {myStudents.length > 0 ? (
                                    myStudents.map(appt => {
                                        const dateObj = new Date(appt.datetime);
                                        const dateStr = !isNaN(dateObj.getTime())
                                            ? `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`
                                            : '일정 확인 필요';

                                        return (
                                            <div
                                                key={appt.id}
                                                className={`status-item-large ${activeReportStudent?.id === appt.id ? 'active' : ''}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    padding: '20px',
                                                    border: activeReportStudent?.id === appt.id ? '2px solid #a67c00' : '1px solid transparent',
                                                    transform: activeReportStudent?.id === appt.id ? 'translateY(-5px)' : 'none',
                                                    boxShadow: activeReportStudent?.id === appt.id ? '0 8px 20px rgba(166,124,0,0.15)' : 'none'
                                                }}
                                                onClick={() => handleSelectStudent(appt)}
                                                onMouseOver={(e) => { if (activeReportStudent?.id !== appt.id) e.currentTarget.style.transform = 'translateY(-5px)'; }}
                                                onMouseOut={(e) => { if (activeReportStudent?.id !== appt.id) e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                <span className="card-label" style={{ fontSize: '0.8rem', color: '#8d6e63' }}>{dateStr} 수업</span>
                                                <span className="card-value highlight-gold" style={{ fontSize: '1.2rem', marginTop: '5px', display: 'block' }}>{appt.nickname} 학생</span>
                                                <span className="click-hint">{activeReportStudent?.id === appt.id ? '선택됨' : '리포트 보기'}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="status-item-large" style={{ cursor: 'default', opacity: 0.6 }}>
                                        <span className="card-label">담당 학생</span>
                                        <span className="card-value highlight-gold">-</span>
                                        <span className="click-hint">예약된 학생이 없습니다.</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="report-group anim-target delay-2">
                        <h2 className="section-title">
                            {activeReportStudent ? `${activeReportStudent.nickname} 학생 발음 리포트` : '학생 발음 리포트'}
                        </h2>
                        <section className="report-section-card" style={{ padding: '24px', background: 'transparent', boxShadow: 'none' }}>
                            {activeReportLoading ? (
                                <div className="loading-container" style={{
                                    background: 'white',
                                    borderRadius: '24px',
                                    padding: '50px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                                }}>
                                    <div className="spinner" />
                                    <p style={{ marginTop: '20px', color: '#8d6e63' }}>데이터를 분석 중입니다...</p>
                                </div>
                            ) : activeReportStudent ? (
                                <div className="report-cards-container" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                    gap: '24px'
                                }}>
                                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                                        <PronunciationWeaknessRadar weaknessStats={activeReportStats} />
                                    </div>
                                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                                        <AiFeedback feedback={activeReportAi} />
                                    </div>
                                </div>
                            ) : (
                                <div className="placeholder-box" style={{
                                    height: '300px',
                                    background: 'white',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8d6e63',
                                    fontSize: '1rem',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                                }}>
                                    학생을 선택하여 발음 리포트를 확인하세요.
                                </div>
                            )}
                        </section>
                    </div>
                </>
            ) : (
                <>
                    <div className="report-group anim-target delay-1">
                        <h2 className="section-title">내 학습 현황</h2>
                        <section className="status-section-card">
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
                    </div>

                    <div className="report-group anim-target delay-2">
                        <h2 className="section-title">학습 리포트</h2>
                        <section className="report-section-card">
                            <div className="report-cards-container">
                                <PronunciationWeaknessRadar weaknessStats={weaknessStats} />
                            </div>
                        </section>
                    </div>
                </>
            )}

            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    role={localStorage.getItem('userRole') || 'USER'}
                />
            )}

            {isReportModalOpen && reportStudentId && (
                <ReportModal
                    studentId={reportStudentId}
                    studentNickname={reportStudentNickname}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ReportPage;