import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index';
import './TutorSelection.css';

import rmitu1 from '../../assets/img/rmitu1.png';
import rmitu2 from '../../assets/img/rmitu2.png';
import rmitu3 from '../../assets/img/rmitu3.png';
import rmitu4 from '../../assets/img/rmitu4.png';
import rmitu5 from '../../assets/img/rmitu5.png';

const RANDOM_INTRODUCTIONS = [
    "꼼꼼한 피드백으로 영어 발음의 기초를 확실히 잡아드립니다!",
    "비즈니스 회화 실력을 단기간에 끌어올려 드릴게요.",
    "원어민 같은 억양, 저와 함께라면 가능합니다.",
    "실전 영어를 쉽고 재미있게 가르쳐 드리는 튜터입니다.",
    "초보자도 당당하게 말할 수 있도록 도와드립니다."
];

const RANDOM_IMAGES = [rmitu1, rmitu2, rmitu3, rmitu4, rmitu5];

const RANDOM_ORGS = [
    "바르미 어학원",
    "글로벌 에듀케이션",
    "프리랜서 교육팀",
    "스피킹 마스터즈",
    "하이엔드 영어센터"
];

const TutorSelection = () => {
    const [tutors, setTutors] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                const res = await api.get('/users/tutors');
                const serverData = res.data.data || [];

                const randomizedTutors = serverData.map(tutor => {
                    const randomImg = RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)];
                    const randomIntro = RANDOM_INTRODUCTIONS[Math.floor(Math.random() * RANDOM_INTRODUCTIONS.length)];
                    const randomOrg = RANDOM_ORGS[Math.floor(Math.random() * RANDOM_ORGS.length)];

                    return {
                        ...tutor,
                        profileImgUrl: randomImg, 
                        introduction: randomIntro,
                        organization: randomOrg 
                    };
                });

                setTutors(randomizedTutors);
            } catch (error) {
                console.error("튜터 목록 로드 실패", error);
            }
        };
        fetchTutors();
    }, []);

    const handleCardClick = (tutor) => {
        navigate(`/tutoring/reserve/${tutor.id}`, { 
            state: { tutorInfo: tutor } 
        });
    };

    return (
        <div className="tutor-selection-container">
            <h2>선생님을 선택해주세요</h2>
            <div className="tutor-grid">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-card-detail" onClick={() => handleCardClick(tutor)}>
                        <div className="tutor-img-wrapper">
                            {tutor.profileImgUrl ? (
                                <img src={tutor.profileImgUrl} alt={tutor.nickname} className="tutor-img" />
                            ) : (
                                <div className="tutor-avatar">{tutor.nickname?.charAt(0)}</div>
                            )}
                        </div>
                        <div className="tutor-info">
                            <h3 className="tutor-name">{tutor.nickname} 선생님</h3>
                            <p className="tutor-email">{tutor.email}</p>
                            <p className="tutor-org">🏢 {tutor.organization}</p>
                            <p className="tutor-desc">“ {tutor.introduction} ”</p>
                        </div>
                        <button className="select-btn">수업 보기</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TutorSelection;