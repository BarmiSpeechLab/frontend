import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

// 09:00 ~ 20:30까지 30분 단위 시간대 생성
const TIMES = Array.from({ length: 24 }, (_, i) => {
    const h = Math.floor(i / 2) + 9;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

const SchedulePage = () => {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimes, setSelectedTimes] = useState([]);

    // 날짜 변경 시 선택 시간 초기화
    useEffect(() => {
        setSelectedTimes([]);
    }, [selectedDate]);

    const handleDateClick = (date) => {
        setSelectedTimes([]);
        setSelectedDate(date);
        setStep(2);
    };

    const toggleTimeSlot = (time) => {
        setSelectedTimes(prev =>
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    const handleSave = async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            alert("로그인이 필요합니다!");
            return;
        }

        // YYYY-MM-DD 형식으로 날짜 변환
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        try {
            // 각 시간마다 API 요청 (POST)
            const promises = selectedTimes.map(time => {
                const dateTime = `${dateStr}T${time}:00`;

                console.log("전송할 데이터:", dateTime);

                return axios.post(
                    '/api/meetings',
                    dateTime,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            });

            // 모든 요청이 완료될 때까지 대기
            await Promise.all(promises);

            alert(`${selectedTimes.length}개 시간대 저장 완료!`);
            setSelectedTimes([]);
            setStep(1);

        } catch (error) {
            console.error("저장 실패:", error);

            if (error.response?.status === 401) {
                alert("이미 선택한 시간이 포함되어 있습니다! 중복된 시간을 확인해주세요.");
            } else if (error.response?.status === 403) {
                alert("튜터 권한이 필요합니다.");
            } else {
                alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }
        }
    };

    return (
        <div className="schedule-container">
            {step === 1 && (
                <div className="step-container fade-in">
                    <h2 className="section-title">수업 날짜를 선택해주세요!</h2>
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        onClickDay={handleDateClick}
                        minDate={new Date()} // 오늘 이후만 선택 가능
                        formatDay={(locale, date) => date.getDate()} // '일' 제거
                    />
                </div>
            )}

            {step === 2 && (
                <div className="step-container fade-in">
                    <button className="back-btn" onClick={() => setStep(1)}>
                        ← 날짜 다시 고르기
                    </button>
                    <h2 className="section-title">
                        시간 설정
                    </h2>
                    <div className="time-grid">
                        {TIMES.filter(t => t <= "20:30").map(time => (
                            <button
                                key={time}
                                className={`time-btn ${selectedTimes.includes(time) ? 'active' : ''}`}
                                onClick={() => toggleTimeSlot(time)}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={selectedTimes.length === 0}
                    >
                        {selectedTimes.length > 0
                            ? `${selectedTimes.length}개 시간 저장하기`
                            : '시간을 선택해주세요'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;