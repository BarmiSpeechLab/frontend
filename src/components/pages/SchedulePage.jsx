import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

// 시간대 배열 (09:00 ~ 20:30)
const TIMES = Array.from({ length: 24 }, (_, i) => {
    const h = Math.floor(i / 2) + 9;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

const WeeklyScheduler = ({ scheduleData }) => {
    // 오늘부터 7일간의 날짜 배열 생성
    const getWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    return (
        <div className="weekly-scheduler">
            <div className="time-labels">
                {TIMES.map(time => <div key={time} className="time-label">{time}</div>)}
            </div>
            
            <div className="days-grid">
                {weekDays.map((day, idx) => (
                    <div key={idx} className="day-column">
                        <div className="day-header">{['일','월','화','수','목','금','토'][day.getDay()]}</div>
                        <div className="time-slots-container">
                            {/* 낮 12시 빨간 선 (오전 9시부터 3시간 뒤 위치) */}
                            <div className="noon-line" style={{ top: 'calc(3 * 60px)' }}></div>
                            
                            {/* 실제 시간 칸들 */}
                            {TIMES.map(time => {
                                // 임시 데이터 로직 (나중에는 DB 데이터와 대조)
                                const isAvailable = Math.random() > 0.7; // 옅은 초록
                                const isBooked = Math.random() > 0.85;  // 짙은 초록
                                
                                return (
                                    <div 
                                        key={time} 
                                        className={`slot ${isBooked ? 'booked' : isAvailable ? 'available' : ''}`}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SchedulePage = () => {
    // 현재 단계를 관리 (1: 날짜 선택, 2: 시간 선택)
    const [step, setStep] = useState(1); 
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimes, setSelectedTimes] = useState([]);

    // 날짜를 클릭했을 때 실행되는 함수
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setStep(2); // 날짜를 고르면 바로 다음 단계(시간 선택)로 이동!
    };

    // 시간 생성 및 토글 로직은 이전과 동일
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const h = Math.floor(i / 2) + 9;
        const m = i % 2 === 0 ? '00' : '30';
        return `${String(h).padStart(2, '0')}:${m}`;
    }).filter(t => t <= "20:30");

    const toggleTimeSlot = (time) => {
        setSelectedTimes(prev => 
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    const handleSave = () => {
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        console.log("저장 데이터:", { date: dateStr, times: selectedTimes });
        alert(`${dateStr} 일정 저장 완료!`);
        setStep(1); // 저장 후 다시 달력으로 이동
    };

    return (
        <div className="schedule-container">
            {/* 1단계: 날짜 선택 화면 */}
            {step === 1 && (
                <div className="step-container fade-in">
                    <h2>수업 날짜를 선택해주세요</h2>
                    <Calendar 
                        onChange={setSelectedDate} 
                        value={selectedDate}
                        onClickDay={handleDateClick} // 날짜 클릭 이벤트
                    />
                    <div style={{ width: '100%', marginTop: '50px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>이번 주 전체 일정 요약</h3>
                        <WeeklyScheduler /> 
                    </div>
                </div>
            )}

            {/* 2단계: 시간 선택 화면 */}
            {step === 2 && (
                <div className="step-container fade-in">
                    <button className="back-btn" onClick={() => setStep(1)}>← 날짜 다시 고르기</button>
                    <h2>{selectedDate.toLocaleDateString()} 시간 설정</h2>
                    <div className="time-grid">
                        {timeSlots.map(time => (
                            <button
                                key={time}
                                className={`time-btn ${selectedTimes.includes(time) ? 'active' : ''}`}
                                onClick={() => toggleTimeSlot(time)}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                    <button className="save-btn" onClick={handleSave}>이 날짜로 저장하기</button>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;