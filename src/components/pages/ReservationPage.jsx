import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../../api/index';
import 'react-calendar/dist/Calendar.css';
import './ReservationPage.css';

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

    // 📅 데이터 로드 (수정된 로직)
    useEffect(() => {
        if (!tutorId) {
            alert("잘못된 접근입니다.");
            navigate(-1);
            return;
        }

        const fetchSchedule = async () => {
            try {
                // 1. 말씀하신 튜터 일정 조회 API 호출
                const res = await api.get(`/meetings/tutor/${tutorId}/available`);
                const allMeetings = res.data.data || res.data || [];

                // ✅ 2. [핵심] 이미 예약된(roomId가 생성된) 수업은 UI에서 삭제
                // web_rtc_room_id가 null인 것만 '진짜 예약 가능'한 슬롯입니다.
                const purelyAvailable = allMeetings.filter(m => 
                    m.roomId === null || m.roomId === undefined
                );

                setAvailableMeetings(purelyAvailable);

                // 3. 만약 튜터 정보가 없다면 응답 데이터에서 추출 (새로고침 대응)
                if (!tutorInfo && purelyAvailable.length > 0) {
                    setTutorInfo({
                        id: tutorId,
                        nickname: purelyAvailable[0].tutorNickname || "선생님"
                    });
                }
            } catch (error) {
                console.error("스케줄 로드 실패:", error);
            }
        };

        fetchSchedule();
    }, [tutorId, navigate]);

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
            // ✅ 시간순 정렬 (09:00 -> 20:00 순)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        setDisplayTimes(timesForDay);
    }, [selectedDate, availableMeetings]);

    const handleConfirm = async (meetingId) => {
        if (!window.confirm("이 수업을 예약하시겠습니까?")) return;

        try {
            // ✅ 학생의 튜터링 참여 API (POST /api/meetings/{id}/join)
            await api.post(`/meetings/${meetingId}/join`);
            alert("예약이 완료되었습니다! 내 강의실로 이동합니다.");
            navigate('/tutoring');
        } catch (error) {
            console.error("예약 실패:", error);
            // 409 에러 등 발생 시 서버 메시지 노출
            const msg = error.response?.data?.message || "이미 예약되었거나 참여할 수 없는 수업입니다.";
            alert(msg);
        }
    };

    // 로딩 처리 보강
    if (!tutorId) return null;
    if (!tutorInfo && availableMeetings.length === 0) return <div className="loading">일정을 불러오는 중입니다...</div>;

    return (
        <div className="reservation-page">
            <h2>{tutorInfo?.nickname || 'Amy'} 선생님 수업 예약</h2>
            <div className="reservation-content">
                <div className="calendar-section">
                    <Calendar 
                        onChange={setSelectedDate} 
                        value={selectedDate}
                        formatDay={(locale, date) => date.getDate()} 
                        tileDisabled={({ date }) => {
                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            // 예약 가능한(roomId가 null인) 일정이 있는 날짜만 활성화
                            return !availableMeetings.some(m => m.datetime && m.datetime.startsWith(dateStr));
                        }}
                    />
                </div>

                <div className="time-grid-section">
                    <h3>{selectedDate.toLocaleDateString()} 가능 시간</h3>
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