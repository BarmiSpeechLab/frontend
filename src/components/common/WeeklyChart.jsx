import React, { useMemo } from 'react';
import './WeeklyChart.css';

/**
 * 주간 학습 현황 막대 그래프 컴포넌트
 * 최근 7일간의 학습 시간을 시각화
 */
const WeeklyChart = ({ weeklyStats = {} }) => {
    const getWeekData = useMemo(() => {
        const today = new Date();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            
            weekData.push({
                date: dateStr,
                dayName,
                minutes: weeklyStats[dateStr] || 0,
                displayDate: date
            });
        }

        return weekData;
    }, [weeklyStats]);

    const maxMinutes = useMemo(() => {
        const max = Math.max(...getWeekData.map(d => d.minutes), 60);
        return Math.ceil(max / 10) * 10;
    }, [getWeekData]);

    return (
        <div className="weekly-chart">
            <div className="chart-header">
                <h3 className="chart-title">주간 학습</h3>
            </div>

            <div className="chart-container">
                <div className="chart-bars">
                    {getWeekData.map((dayData) => {
                        const heightPercent = (dayData.minutes / maxMinutes) * 100 || 0;
                        let intensityClass = '';
                        
                        if (heightPercent >= 80) intensityClass = 'intense-5';
                        else if (heightPercent >= 60) intensityClass = 'intense-4';
                        else if (heightPercent >= 40) intensityClass = 'intense-3';
                        else if (heightPercent >= 20) intensityClass = 'intense-2';
                        else if (heightPercent > 0) intensityClass = 'intense-1';
                        else intensityClass = 'intense-0';
                        
                        return (
                            <div key={dayData.date} className="bar-wrapper">
                                {heightPercent > 0 && (
                                    <div 
                                        className={`bar ${intensityClass}`}
                                        style={{ height: `${heightPercent}%` }}
                                        title={`${dayData.dayName}: ${dayData.minutes}분`}
                                    />
                                )}
                                <div className="day-name">{dayData.dayName}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyChart;
