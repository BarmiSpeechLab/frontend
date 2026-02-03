import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TutorSelection.css';

const TutorSelection = () => {
    const navigate = useNavigate();

    // 임시 데이터 (나중에는 axios로 백엔드에서 받아옵니다)
    const tutors = [
        { id: '1', name: 'James Park', intro: '초보 탈출! 입이 트이는 영어', email: 'james@test.com' },
        { id: '2', name: 'Emily Blunt', intro: '원어민 뉘앙스 완벽 마스터', email: 'emily@test.com' },
        { id: '3', name: 'Minji Kim', intro: '[취업반] 토익스피킹/OPIc 완성', email: 'minji@test.com' },
    ];

    return (
        <div className="selection-container">
            <h2>함께 공부할 튜터를 선택해주세요</h2>
            <div className="tutor-grid">
                {tutors.map((tutor) => (
                    <div 
                        key={tutor.id} 
                        className="tutor-card"
                        onClick={() => navigate(`/tutoring/reserve/${tutor.id}`, { state: { tutorName: tutor.name, tutorEmail: tutor.email } })}
                    >
                        <div className="tutor-avatar"></div>
                        <h3>{tutor.name}</h3>
                        <p>{tutor.intro}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TutorSelection;