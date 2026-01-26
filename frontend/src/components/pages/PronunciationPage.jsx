import React, { useState } from 'react';
import './SubPage.css';

const PronunciationPage = () => {
    const [activeTab, setActiveTab] = useState('vowels');

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">발음기호 학습</h1>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'vowels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vowels')}
                >
                    모음
                </button>
                <button
                    className={`tab-btn ${activeTab === 'consonants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consonants')}
                >
                    자음
                </button>
            </div>

            <div className="card-grid col-4">
                {/* 세부 내용은 나중에 */}
            </div>
        </div>
    );
};

export default PronunciationPage;
