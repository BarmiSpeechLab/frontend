import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index';
import './TutoringLobby.css';
import rmitu1 from '../../assets/img/rmitu1.png';
import rmitu2 from '../../assets/img/rmitu2.png';
import rmitu3 from '../../assets/img/rmitu3.png';
import rmitu4 from '../../assets/img/rmitu4.png';
import rmitu5 from '../../assets/img/rmitu5.png';
import rmitu6 from '../../assets/img/rmitu6.png';
import rmitu7 from '../../assets/img/rmitu7.png';

const RANDOM_INTRODUCTIONS = [
    "꼼꼼한 피드백으로 영어 발음의 기초를 확실히 잡아드립니다!",
    "비즈니스 회화 실력을 단기간에 끌어올려 드릴게요.",
    "원어민 같은 억양, 저와 함께라면 가능합니다.",
    "실전 영어를 쉽고 재미있게 가르쳐 드리는 튜터입니다.",
    "초보자도 당당하게 말할 수 있도록 도와드립니다."
];

const RANDOM_IMAGES = [rmitu1, rmitu2, rmitu3, rmitu4, rmitu5, rmitu6, rmitu7];

const TutoringLobby = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [recommendedTutors, setRecommendedTutors] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const userRole = localStorage.getItem('userRole');
    const myId = localStorage.getItem('userId');
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

    useEffect(() => {
        console.log("=== 로컬스토리지 상태 확인 ===");
        console.log("userRole:", userRole);
        console.log("userId:", myId);
        console.log("token:", token ? "존재함" : "없음");
        console.log("전체 localStorage:", { ...localStorage });
    }, []);

    // 1. 나의 수업 일정 불러오기
    useEffect(() => {
        const fetchMyAppointments = async () => {
            // 토큰 확인
            if (!token) {
                console.error("토큰이 없습니다. 로그인이 필요합니다.");
                alert("로그인이 필요한 서비스입니다.");
                navigate('/login');
                return;
            }

            try {
                // 튜티(학생)의 경우 /meetings/reserved (본인이 예약한 목록) 호출
                const endpoint = userRole === 'TUTOR'
                    ? '/meetings/tutor-meetings'
                    : '/meetings/reserved';

                console.log(`[API 요청] 내 일정 조회: ${endpoint}`);
                console.log(`[사용자 정보] Role: ${userRole}, ID: ${myId}`);

                // 헤더 확인 로그
                console.log("요청 헤더 (api 인스턴스):", api.defaults.headers);

                const res = await api.get(endpoint);
                const serverData = res.data.data || [];

                console.log("✅ 서버 응답 성공!");
                console.log("서버 원본 데이터:", serverData);
                console.log("데이터 개수:", serverData.length);

                // 필터 제거 - 서버에서 받은 데이터를 그대로 사용
                const processedData = serverData.map(appt => {
                    console.log("개별 예약 데이터:", appt);

                    return {
                        ...appt,
                        roomId: appt.roomId || appt.webRtcRoomId || '',
                        topic: appt.topic || "1:1 영어 회화 및 발음 교정",
                        datetime: appt.datetime || appt.date || appt.scheduledAt
                    };
                }).sort((a, b) => {
                    const dateA = new Date(a.datetime);
                    const dateB = new Date(b.datetime);
                    return dateA - dateB;
                });

                console.log("가공된 데이터:", processedData);
                setAppointments(processedData);

            } catch (error) {
                console.error("❌ 일정 조회 실패:", error);
                console.error("에러 상세:", error.response?.data || error.message);
                console.error("HTTP 상태:", error.response?.status);

                // 403 에러 특별 처리
                if (error.response?.status === 403) {
                    console.error("🔒 권한 없음 (403 Forbidden)");
                    console.error("가능한 원인:");
                    console.error("1. 토큰이 만료되었거나 유효하지 않음");
                    console.error("2. 해당 API에 접근 권한이 없음");
                    console.error("3. userRole이 올바르지 않음");

                    alert("접근 권한이 없습니다. 다시 로그인해주세요.");
                    // 필요시 로그아웃 처리
                    // localStorage.clear();
                    // navigate('/login');
                }

                setAppointments([]);
            }
        };

        if (myId && token) {
            fetchMyAppointments();
        } else {
            console.warn("⚠️ 사용자 ID 또는 토큰이 없습니다.");
            if (!token) {
                console.warn("→ 로그인 페이지로 이동이 필요할 수 있습니다.");
            }
        }
    }, [userRole, myId, token, navigate]);

    // 2.튜터 목록 조회 (학생일 때만 실행)
    useEffect(() => {
        if (userRole === 'TUTOR') {
            console.log("튜터 모드 - 추천 튜터 섹션 미표시");
            return;
        }

        const fetchRandomTutors = async () => {
            try {
                const res = await api.get('/users/tutors');
                const allTutors = res.data.data || [];
                const shuffled = [...allTutors].sort(() => 0.5 - Math.random());

                const randomizedTutors = shuffled.slice(0, 3).map(tutor => {
                    const tId = Number(tutor.id);
                    const imgIndex = (tId - 1) % RANDOM_IMAGES.length;
                    const introIndex = (tId - 1) % RANDOM_INTRODUCTIONS.length;

                    return {
                        ...tutor,
                        profileImgUrl: RANDOM_IMAGES[imgIndex],
                        introduction: RANDOM_INTRODUCTIONS[introIndex] // 한줄 소개 랜덤 할당
                    };
                });

                setRecommendedTutors(randomizedTutors);
            } catch (error) {
                console.error("추천 튜터 로드 실패:", error);
                setRecommendedTutors([]);
            }
        };
        fetchRandomTutors();
    }, [userRole]);

    // 3. 실시간 시간 업데이트 (1초 주기)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 입장 가능 여부 및 버튼 상태 계산 로직
    const getButtonStatus = (dateTimeStr, hasRoomId) => {
        if (!dateTimeStr) {
            return { active: false, label: '일정 정보 없음', className: 'disabled' };
        }

        const classStart = new Date(dateTimeStr);

        if (isNaN(classStart.getTime())) {
            console.error("잘못된 날짜 형식:", dateTimeStr);
            return { active: false, label: '날짜 오류', className: 'disabled' };
        }

        const entryStart = new Date(classStart.getTime() - 5 * 60 * 1000);
        const entryEnd = new Date(classStart.getTime() + 30 * 60 * 1000);

        if (currentTime < entryStart) {
            return { active: false, label: '수업 5분 전 입장 가능', className: 'disabled' };
        } else if (currentTime > entryEnd) {
            return { active: false, label: '수업 종료', className: 'disabled' };
        }

        if (!hasRoomId) {
            return { active: false, label: '강의실 준비 중...', className: 'waiting' };
        }

        return { active: true, label: '입장하기', className: 'active' };
    };

    const handleJoin = (roomId) => {
        if (roomId) {
            console.log("입장 시도 - Room ID:", roomId);
            navigate(`/tutoring/${roomId}`);
        } else {
            alert("강의실 정보가 없습니다. 관리자에게 문의해주세요.");
        }
    };

    return (
        <div className="lobby-container">
            {userRole !== 'TUTOR' && <h1 className="subpage-title">1:1 튜터링</h1>}

            {userRole !== 'TUTOR' && (
                <section className="tutor-section">
                    <div className="tutor-header-right">
                        <button className="more-btn" onClick={() => navigate('/tutoring/reserve')} style={{ paddingRight: 0 /* Force Align */ }}>
                            튜터링 예약하기
                        </button>
                    </div>
                    <div className="tutor-grid">
                        {recommendedTutors.length > 0 ? (
                            recommendedTutors.map((tutor) => (
                                <div key={tutor.id} className="tutor-card-mini glass-panel" onClick={() => navigate(`/tutoring/reserve/${tutor.id}`)}>
                                    <div className="tutor-img-wrapper">
                                        {/* profileImgUrl 출력 */}
                                        {tutor.profileImgUrl ? (
                                            <img src={tutor.profileImgUrl} alt={tutor.nickname} className="tutor-img" />
                                        ) : (
                                            <div className="tutor-img-placeholder">{tutor.nickname?.charAt(0) || '?'}</div>
                                        )}
                                    </div>
                                    <div className="tutor-info">
                                        <h3 className="tutor-name">{tutor.nickname}</h3>
                                        {/* introduction 출력 */}
                                        <p className="tutor-desc">{tutor.introduction}</p>
                                        <button className="tutor-action-btn">수업 보기</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data-msg">추천 튜터를 불러오는 중 ...</div>
                        )}
                    </div>
                </section>
            )}

            {userRole !== 'TUTOR' && <div className="divider"></div>}

            <section className="appointment-section">
                <h2 className="section-title">나의 수업 일정</h2>
                <div className="glass-panel schedule-container">
                    <div className="appointment-list">
                        {appointments.length > 0 ? (
                            appointments.map((appt) => {
                                const hasRoomId = appt.roomId && appt.roomId.length > 0;
                                const status = getButtonStatus(appt.datetime, hasRoomId);
                                const dateObj = new Date(appt.datetime);
                                const isValidDate = !isNaN(dateObj.getTime());

                                return (
                                    <div key={appt.id} className="appointment-card">
                                        <div className="card-info">
                                            <div className="card-date">
                                                {isValidDate
                                                    ? dateObj.toLocaleDateString('ko-KR')
                                                    : '날짜 정보 없음'
                                                }
                                                <span className="time-badge">
                                                    {isValidDate
                                                        ? dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                                                        : '--:--'
                                                    }
                                                </span>
                                            </div>
                                            <h3 className="teacher-name">
                                                {userRole === 'TUTOR'
                                                    ? `${appt.tuteeNickname || '익명 학생'} 학생`
                                                    : `${appt.tutorNickname || '담당 선생님'} 선생님`}
                                            </h3>
                                            <p className="class-topic">
                                                {appt.topic}
                                            </p>
                                        </div>
                                        <div className="card-action">
                                            <button
                                                onClick={() => handleJoin(appt.roomId)}
                                                disabled={!status.active}
                                                className={`join-btn ${status.className}`}
                                            >
                                                {status.label}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-data-msg">예정된 수업 일정이 없습니다.</div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TutoringLobby;