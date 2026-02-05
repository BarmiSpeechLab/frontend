// src/components/pages/TutorSelection.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index'; // api 인스턴스 사용 권장
import './TutorSelection.css';

const TutorSelection = () => {
    const [tutors, setTutors] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                // 튜터 목록 조회 (이건 잘 된다고 하셨으므로 유지)
                const res = await api.get('/users/tutors');
                setTutors(res.data.data || []);
            } catch (error) {
                console.error("튜터 목록 로드 실패", error);
            }
        };
        fetchTutors();
    }, []);

    const handleCardClick = (tutor) => {
        // 🚀 핵심 수정: navigate할 때 state에 tutor 객체 전체를 담아 보냅니다.
        navigate(`/tutoring/reserve/${tutor.id}`, { 
            state: { tutorInfo: tutor } 
        });
    };

    return (
        <div className="tutor-selection-container">
            <h2>선생님을 선택해주세요</h2>
            <div className="tutor-grid">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-card" onClick={() => handleCardClick(tutor)}>
                        <div className="tutor-avatar">{tutor.nickname?.charAt(0)}</div>
                        <div className="tutor-info">
                            <h3>{tutor.nickname} 선생님</h3>
                            <p>{tutor.email}</p>
                        </div>
                        <button className="select-btn">수업 보기</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TutorSelection;