import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SubPage.css';
import './PronunciationPage.css';

const LearningTopicPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // LearningPage에서 전달된 토픽
    const { topic } = location.state || {};

    // 단어 탭 + 문장 탭
    const [activeTab, setActiveTab] = useState('words');

    if (!topic) {
        return <div style={{ padding: '2rem' }}>잘못된 접근입니다.</div>;
    }

    const handleCardClick = (item) => {
        // 완료 시 -> '주제 선택하기'로 돌아가기 위해 returnPath 주입
        navigate('/pronunciationPractice', {
            state: {
                ...item,
                returnPath: '/learning'
            }
        });
    };

    // 현재 탭에 맞는 데이터
    const currentList = topic[activeTab] || [];

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">{topic.title}</h1>

            <div className="tabs" style={{ display: 'none' }}>
            </div>

            <div className="card-grid col-3">
                {(topic.words || []).length > 0 ? (
                    (topic.words || []).map((item, index) => (
                        <div
                            key={index}
                            className="epa-card"
                            onClick={() => handleCardClick(item)}
                        >
                            <h2 className="epa-symbol" style={{ fontSize: '2.5rem' }}>
                                {item.word}
                            </h2>
                            <p className="epa-word">
                                {item.pronunciation ? `[${item.pronunciation}]` : ''} ({item.meaning})
                            </p>

                            <div className="epa-progress-bg">
                                <div
                                    className="epa-progress-fill"
                                    style={{ width: `${item.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '2rem' }}>
                        학습 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};
export default LearningTopicPage;