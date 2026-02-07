import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../../api/index';
import 'react-calendar/dist/Calendar.css';
import './ReservationPage.css';

// ✅ 이미지 Import 추가
import rmitu1 from '../../assets/img/rmitu1.png';
import rmitu2 from '../../assets/img/rmitu2.png';
import rmitu3 from '../../assets/img/rmitu3.png';
import rmitu4 from '../../assets/img/rmitu4.png';
import rmitu5 from '../../assets/img/rmitu5.png';
import rmitu6 from '../../assets/img/rmitu6.png';
import rmitu7 from '../../assets/img/rmitu7.png';

const RANDOM_IMAGES = [rmitu1, rmitu2, rmitu3, rmitu4, rmitu5, rmitu6, rmitu7];

const ReservationPage = () => {
    const { tutorId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. 이전 페이지에서 넘겨준 튜터 정보 (없으면 null)
    const passedTutorInfo = location.state?.tutorInfo;
    const [tutorInfo, setTutorInfo] = useState(passedTutorInfo || null);
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableMeetings, setAvailableMeetings] = useState([]); 
    const [displayTimes, setDisplayTimes] = useState([]);

    // ✅ 튜터 ID 기반 고정 이미지 매칭
    const tId = Number(tutorId);
    const tutorImg = RANDOM_IMAGES[(tId - 1) % RANDOM_IMAGES.length];

    // 📅 데이터 로드
    useEffect(() => {
        if (!tutorId) {
            alert("잘못된 접근입니다.");
            navigate(-1);
            return;
        }

        const fetchSchedule = async () => {
            try {
                const res = await api.get(`/meetings/tutor/${tutorId}/available`);
                const allMeetings = res.data.data || res.data || [];

                const purelyAvailable = allMeetings.filter(m => 
                    m.roomId === null || m.roomId === undefined
                );

                setAvailableMeetings(purelyAvailable);

                if (!tutorInfo && purelyAvailable.length > 0) {
                    setTutorInfo({
                        id: tutorId,
                        nickname: purelyAvailable[0].tutorNickname || "선생님",
                        organization: "바르미 어학원" // 기본값
                    });
                }
            } catch (error) {
                console.error("스케줄 로드 실패:", error);
            }
        };

        fetchSchedule();
    }, [tutorId, navigate, tutorInfo]);

    // 📅 날짜 선택 시 시간 필터링 및 정렬
    useEffect(() => {
        if (!selectedDate || availableMeetings.length === 0) {
            setDisplayTimes([]);
            return;
        }

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const timesForDay = availableMeetings
            .filter(m => m.datetime && m.datetime.startsWith(dateStr))
            .map(m => ({
                id: m.id, 
                time: m.datetime.split('T')[1].substring(0, 5) 
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
        
        setDisplayTimes(timesForDay);
    }, [selectedDate, availableMeetings]);

    const handleConfirm = async (meetingId) => {
        if (!window.confirm("이 수업을 예약하시겠습니까?")) return;

        try {
            await api.post(`/meetings/${meetingId}/join`);
            alert("예약이 완료되었습니다! 내 강의실로 이동합니다.");
            navigate('/tutoring');
        } catch (error) {
            console.error("예약 실패:", error);
            const msg = error.response?.data?.message || "이미 예약되었거나 참여할 수 없는 수업입니다.";
            alert(msg);
        }
    };

    if (!tutorId) return null;
    if (!tutorInfo && availableMeetings.length === 0) return <div className="loading">일정을 불러오는 중입니다...</div>;

    return (
        <div className="reservation-page">
            {/* ✅ 추가된 튜터 프로필 섹션 */}
            <div className="tutor-summary-card">
                <div className="tutor-summary-img-wrapper">
                    <img src={tutorImg} alt={tutorInfo?.nickname} className="tutor-summary-img" />
                </div>
                <div className="tutor-summary-info">
                    <span className="tutor-summary-label">Selected Tutor</span>
                    <h2 className="tutor-summary-name">{tutorInfo?.nickname} 선생님</h2>
                    <p className="tutor-summary-org">{tutorInfo?.organization || '바르미 어학원'}</p>
                </div>
                <button className="reservation-back-btn" onClick={() => navigate(-1)}>교체하기</button>
            </div>

            <div className="reservation-content">
                <div className="calendar-section">
                    <h3>수업 날짜 선택</h3>
                    <Calendar 
                        onChange={setSelectedDate} 
                        value={selectedDate}
                        formatDay={(locale, date) => date.getDate()} 
                        tileDisabled={({ date }) => {
                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            return !availableMeetings.some(m => m.datetime && m.datetime.startsWith(dateStr));
                        }}
                    />
                </div>

                <div className="time-grid-section">
                    <h3>{selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 예약 가능 시간</h3>
                    <div className="time-buttons-grid">
                        {displayTimes.length > 0 ? (
                            displayTimes.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleConfirm(item.id)} 
                                    className="time-btn"
                                >
                                    {item.time}
                                </button>
                            ))
                        ) : (
                            <p className="no-time-msg">예약 가능한 시간이 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationPage;