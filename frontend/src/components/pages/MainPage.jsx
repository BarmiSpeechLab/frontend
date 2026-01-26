import React from 'react';
import rmiImg from '../../assets/img/rmi.png';
import './MainPage.css';

const MainPage = () => {
    return (
        <div className="dashboard-container">
            {/* 상단 헤더 */}
            <header className="dashboard-header">
                <div className="mascot-wrapper">
                    <img src={rmiImg} alt="Mascot" className="dashboard-mascot" />
                </div>
                <h1 className="welcome-text">오늘은 어떤 학습을 해볼까요?</h1>
            </header>

            {/* 내 학습 현황 */}
            <section className="status-section">
                <h2 className="section-title">내 학습 현황</h2>
                <div className="status-cards">
                    <div className="status-card">
                        <span className="card-value highlight-blue">-</span>
                        <span className="card-label">총 학습 시간</span>
                    </div>
                    <div className="status-card">
                        <span className="card-value highlight-blue">-</span>
                        <span className="card-label">완료한 학습</span>
                    </div>
                </div>
            </section>

            {/* 학습 리포트 */}
            <section className="report-section">
                <h2 className="section-title">학습 리포트</h2>
                <div className="placeholder-box">
                    {/* 그래프 영역 */}
                </div>
            </section>

            {/* 취약점 분석 */}
            <section className="analysis-section">
                <h2 className="section-title">취약점 분석</h2>
                <div className="placeholder-box">
                    {/* 진행바 영역 */}
                </div>
            </section>
        </div>
    );
};

export default MainPage;