import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import CryptoJS from 'crypto-js';
import 'react-calendar/dist/Calendar.css';
import './ReservationPage.css';

const ReservationPage = () => {
    const { tutorId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState(new Date());
    // 1. 튜터의 전체 일정 데이터 (나중에는 API로 받아옵니다)
    const [tutorSchedules, setTutorSchedules] = useState([
        { date: '2026-02-05', times: ['09:00', '10:00', '14:00'] },
        { date: '2026-02-10', times: ['13:00', '15:30'] },
        { date: '2026-02-15', times: ['11:00', '16:00', '17:00'] }
    ]);

    // 2. 현재 선택된 날짜에 예약 가능한 시간들만 따로 보관
    const [displayTimes, setDisplayTimes] = useState([]);

    // 날짜가 바뀔 때마다 실행되는 Effect
    useEffect(() => {
        const dateStr = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD 형식
        const scheduleForDate = tutorSchedules.find(s => s.date === dateStr);
        
        if (scheduleForDate) {
            setDisplayTimes(scheduleForDate.times);
        } else {
            setDisplayTimes([]); // 일정이 없는 날은 빈 배열
        }
    }, [selectedDate, tutorSchedules]);

    const handleConfirm = (time) => {
        const userEmail = localStorage.getItem('userEmail');
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        
        // RoomID 해시 생성 로직 (이전과 동일)
        const rawKey = `${state.tutorEmail}_${userEmail}_${dateStr}_${time}`;
        const hashedRoomId = CryptoJS.SHA256(rawKey).toString();

        console.log("예약 정보:", { date: dateStr, time, roomId: hashedRoomId });
        alert(`${state.tutorName} 선생님과 ${dateStr} ${time} 수업이 예약되었습니다!`);
        navigate('/tutoring');
    };

    return (
        <div className="reservation-page">
            <h2>{state?.tutorName || '튜터'} 선생님 예약</h2>
            
            <div className="reservation-content">
                {/* 달력: 튜터가 일정을 올린 날만 활성화 */}
                <Calendar 
                    onChange={setSelectedDate} 
                    value={selectedDate}
                    tileDisabled={({ date }) => {
                        const dateStr = date.toLocaleDateString('en-CA');
                        return !tutorSchedules.find(s => s.date === dateStr);
                    }}
                />
                
                {/* 날짜 선택 시 나타나는 시간 섹션 */}
                <div className="time-section">
                    <h3>{selectedDate.toLocaleDateString()} 선택 가능한 시간</h3>
                    {displayTimes.length > 0 ? (
                        <div className="time-grid">
                            {displayTimes.map(time => (
                                <button key={time} onClick={() => handleConfirm(time)} className="time-btn">
                                    {time} 수업 예약하기
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="no-time-msg">선택하신 날짜에는 가능한 수업 시간이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationPage;