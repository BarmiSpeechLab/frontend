import React from 'react';
import './OverallLearningStats.css';

const formatScore = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

const OverallLearningStats = ({ stats }) => {
    const totalStudyDays = Number(stats?.totalStudyDays || 0);
    const totalTryCount = Number(stats?.totalTryCount || 0);
    const averageScore = formatScore(stats?.averageScore);

    const items = [
        { label: '총 학습 일수', value: `${totalStudyDays}일` },
        { label: '총 발음 시도', value: `${totalTryCount}회` },
        { label: '평균 점수', value: `${averageScore}점` }
    ];

    return (
        <section className="overall-stats-card">
            <div className="overall-stats-grid">
                {items.map((item) => (
                    <div key={item.label} className="overall-stat-item">
                        <span className="overall-stat-label">{item.label}</span>
                        <span className="overall-stat-value">{item.value}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default OverallLearningStats;
