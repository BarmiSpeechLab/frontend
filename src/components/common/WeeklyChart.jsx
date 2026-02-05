import React, { useMemo } from 'react';
import './WeeklyChart.css';

const WeeklyChart = ({ weeklyStats = {} }) => {
    const weekData = useMemo(() => {
        const today = new Date();
        const data = [];
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        for (let i = 6; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dateStr = date.toISOString().split('T')[0];
            const count = Number(weeklyStats[dateStr] || 0);

            data.push({
                date: dateStr,
                dayName: dayNames[date.getDay()],
                count: Number.isFinite(count) ? count : 0
            });
        }

        return data;
    }, [weeklyStats]);

    const maxCount = useMemo(() => {
        return Math.max(...weekData.map((d) => d.count), 1);
    }, [weekData]);

    return (
        <div className="weekly-chart">
            <div className="chart-container">
                <div className="chart-bars">
                    {weekData.map((dayData) => {
                        const heightPercent = (dayData.count / maxCount) * 100;
                        let intensityClass = 'intense-0';
                        if (heightPercent >= 80) intensityClass = 'intense-5';
                        else if (heightPercent >= 60) intensityClass = 'intense-4';
                        else if (heightPercent >= 40) intensityClass = 'intense-3';
                        else if (heightPercent >= 20) intensityClass = 'intense-2';
                        else if (heightPercent > 0) intensityClass = 'intense-1';

                        return (
                            <div key={dayData.date} className="bar-wrapper">
                                {heightPercent > 0 && (
                                    <div
                                        className={`bar ${intensityClass}`}
                                        style={{ height: `${heightPercent}%` }}
                                        title={`${dayData.dayName}: ${dayData.count}회`}
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
