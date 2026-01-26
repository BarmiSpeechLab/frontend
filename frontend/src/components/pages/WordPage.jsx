import React, { useState } from 'react';
import './SubPage.css';

const WordPage = () => {
    const [activeFilter, setActiveFilter] = useState('전체');

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">단어 학습</h1>

            <div className="tabs">
                {['전체', '쉬움', '보통', '어려움'].map(f => (
                    <button
                        key={f}
                        className={`tab-btn ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="card-grid col-3">
                {/* 세부 내용은 나중에 */}
            </div>
        </div>
    );
};

export default WordPage;
