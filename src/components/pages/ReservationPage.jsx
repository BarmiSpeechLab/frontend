import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './ReservationPage.css';

const ReservationPage = () => {
    const { tutorId } = useParams(); // URL에서 ID 추출
    const navigate = useNavigate();

    // 상태 관리
    const [tutorInfo, setTutorInfo] = useState(null); // 튜터 상세 정보
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tutorSchedules, setTutorSchedules] = useState([]); // 튜터의 전체 일정
    const [displayTimes, setDisplayTimes] = useState([]); // 선택 날짜의 시간들

    // [Step 1] 페이지 진입 시 튜터 정보 및 일정 조회
    useEffect(() => {
        const fetchTutorData = async () => {
            try {
                // 1. 튜터 기본 정보 조회 (이름, 이메일 등)
                const infoRes = await axios.get(`/api/users/${tutorId}`);
                setTutorInfo(infoRes.data.data);

                // 2. 튜터의 예약 가능한 전체 일정 조회
                const scheduleRes = await axios.get(`/api/meetings/tutor/${tutorId}/available`);
                setTutorSchedules(scheduleRes.data.data);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
                alert("튜터 정보를 불러올 수 없습니다.");
            }
        };
        fetchTutorData();
    }, [tutorId]);

    // [Step 2] 날짜 변경 시 시간 필터링
    useEffect(() => {
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        const daySchedule = tutorSchedules.find(s => s.date === dateStr);
        setDisplayTimes(daySchedule ? daySchedule.times : []);
    }, [selectedDate, tutorSchedules]);

    // [Step 3] 실제 예약 저장 (백엔드 Meeting Entity 연동)
    const handleConfirm = async (time) => {
        const token = localStorage.getItem('accessToken');
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        
        // 백엔드 LocalDateTime 포맷에 맞게 시간 조합 (T15:30:00)
        const requestDateTime = `${dateStr}T${time}:00`;

        try {
            // 백엔드 Controller의 initializeSession 호출
            const response = await axios.post('/api/meetings/sessions', {
                tutorId: tutorId,
                datetime: requestDateTime
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert('예약이 성공적으로 완료되었습니다!');
                navigate('/tutoring');
            }
        } catch (error) {
            console.error("예약 실패:", error);
            alert("이미 예약되었거나 서버 오류가 발생했습니다.");
        }
    };

    if (!tutorInfo) return <div>로딩 중...</div>;

    return (
        <div className="reservation-page">
            <h2>{tutorInfo.nickname} 선생님 예약</h2>
            <div className="reservation-content">
                <Calendar 
                    onChange={setSelectedDate} 
                    value={selectedDate}
                    tileDisabled={({ date }) => {
                        const dateStr = date.toLocaleDateString('en-CA');
                        return !tutorSchedules.find(s => s.date === dateStr);
                    }}
                />
                
                <div className="time-section">
                    <h3>{selectedDate.toLocaleDateString()} 가능한 시간</h3>
                    <div className="time-grid">
                        {displayTimes.map(time => (
                            <button key={time} onClick={() => handleConfirm(time)} className="time-btn">
                                {time} 수업 예약
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationPage;