import React, { useState } from 'react';
import './SubPage.css';

const SentencePage = () => {
    const [activeTab, setActiveTab] = useState('전체');

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">문장 학습</h1>

            <div className="tabs">
                {['전체', '쉬움', '보통', '어려움'].map(t => (
                    <button
                        key={t}
                        className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="sentence-list">
                {/* 세부 내용은 나중에 */}
            </div>
        </div>
    );
};

export default SentencePage;
