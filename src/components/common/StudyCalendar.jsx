import React, { useMemo, useState } from 'react';
import './StudyCalendar.css';
import calendarIcon from '../../assets/img/calendar3.png';

const StudyCalendar = ({ studyData = {}, studyCounts = {}, onMonthChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i -= 1) {
            days.push({
                date: null,
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                hasStudy: false
            });
        }

        for (let i = 1; i <= lastDay.getDate(); i += 1) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const count = studyCounts[dateStr] || 0;
            days.push({
                date: dateStr,
                day: i,
                isCurrentMonth: true,
                hasStudy: Boolean(studyData[dateStr]),
                studyCount: count
            });
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i += 1) {
            days.push({
                date: null,
                day: i,
                isCurrentMonth: false,
                hasStudy: false
            });
        }

        return days;
    }, [currentDate, studyData, studyCounts]);

    const weeks = useMemo(() => {
        const weeksList = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeksList.push(calendarDays.slice(i, i + 7));
        }
        return weeksList;
    }, [calendarDays]);

    const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        setCurrentDate(newDate);
        if (onMonthChange) {
            onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
        }
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        setCurrentDate(newDate);
        if (onMonthChange) {
            onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
        }
    };

    return (
        <div className="study-calendar">
            <div className="calendar-header">
                <button
                    className="calendar-nav-btn"
                    onClick={handlePrevMonth}
                >
                    {'<'}
                </button>
                <h3 className="calendar-month">{monthYear}</h3>
                <button
                    className="calendar-nav-btn"
                    onClick={handleNextMonth}
                >
                    {'>'}
                </button>
            </div>

            <div className="calendar-grid">
                <div className="calendar-weekdays">
                    {dayLabels.map((day) => (
                        <div key={day} className="weekday-label">
                            {day}
                        </div>
                    ))}
                </div>

                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="calendar-week">
                        {week.map((dayObj, dayIdx) => (
                            <div
                                key={dayIdx}
                                className={`calendar-cell ${dayObj.isCurrentMonth ? 'current' : 'other'} ${dayObj.hasStudy ? 'study' : ''}`}
                            >
                                <span className="calendar-day-number">{dayObj.day}</span>
                                {dayObj.hasStudy && dayObj.isCurrentMonth && (
                                    <>
                                        <img src={calendarIcon} alt="학습" className="study-stamp" />
                                        <div className="study-tooltip">
                                            {dayObj.studyCount}회 학습
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudyCalendar;
