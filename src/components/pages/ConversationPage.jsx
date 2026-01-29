import React from 'react';
import './SubPage.css';

const ConversationPage = () => {
    return (
        <div className="subpage-container">
            <h1 className="subpage-title">회화 연습</h1>
            <p className="subpage-desc">아바타와 함께 회화 연습을 해보세요.</p>

            <div className="conversation-list">
                {/* 세부 내용은 나중에 */}
            </div>
        </div>
    );
};

export default ConversationPage;
