import React, { useState, useMemo } from 'react';
import './StudyCalendar.css';

/**
 * 월간 달력 컴포넌트
 * 특정 월의 모든 날짜와 학습 현황을 표시
 */
const StudyCalendar = ({ studyData = {} }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // 해당 월의 첫 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 첫 날의 요일 (0 = 일요일)
        const startingDayOfWeek = firstDay.getDay();
        
        // 달력에 표시할 모든 날
        const days = [];
        
        // 이전 월의 날들 (앞부분 채우기)
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: null,
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                hasStudy: false
            });
        }
        
        // 이번 월의 날들
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                day: i,
                isCurrentMonth: true,
                hasStudy: studyData[dateStr] || false
            });
        }
        
        // 다음 월의 날들 (뒷부분 채우기)
        const remainingDays = 42 - days.length; // 6주 × 7일
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: null,
                day: i,
                isCurrentMonth: false,
                hasStudy: false
            });
        }
        
        return days;
    }, [currentDate, studyData]);

    // 주별로 분할
    const weeks = useMemo(() => {
        const weeksList = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeksList.push(calendarDays.slice(i, i + 7));
        }
        return weeksList;
    }, [calendarDays]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="study-calendar">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}>{'<'}</button>
                <h3 className="calendar-month">{monthYear}</h3>
                <button className="calendar-nav-btn" onClick={handleNextMonth}>{'>'}</button>
            </div>

            <div className="calendar-grid">
                {/* 요일 헤더 */}
                <div className="calendar-weekdays">
                    {dayLabels.map((day) => (
                        <div key={day} className="weekday-label">{day}</div>
                    ))}
                </div>

                {/* 달력 셀 */}
                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="calendar-week">
                        {week.map((dayObj, dayIdx) => (
                            <div
                                key={dayIdx}
                                className={`calendar-cell ${dayObj.isCurrentMonth ? 'current' : 'other'} ${dayObj.hasStudy ? 'study' : ''}`}
                                title={dayObj.isCurrentMonth && dayObj.hasStudy ? `${dayObj.day}일: 학습함` : ''}
                            >
                                {dayObj.hasStudy && dayObj.isCurrentMonth ? '👣' : dayObj.day}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="calendar-legend">
                <span className="legend-label">학습 없음</span>
                <div className="legend-colors">
                    <div className="legend-cell empty"></div>
                    <div className="legend-cell study"></div>
                </div>
                <span className="legend-label">학습함</span>
            </div>
        </div>
    );
};

export default StudyCalendar;
