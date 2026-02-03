import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TutoringLobby.css';

const TutoringLobby = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    // 0. 추천 튜터 더미 데이터 (새로 추가됨)
    const mockTutors = [
        { id: 1, name: 'James Park', desc: '초보 탈출! 입이 트이는 영어', img: 'https://via.placeholder.com/150' },
        { id: 2, name: 'Emily Blunt', desc: '원어민 뉘앙스 완벽 마스터', img: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Minji Kim', desc: '[취업반] 토익스피킹/OPIc 완성', img: 'https://via.placeholder.com/150' },
    ];

    // 1. 테스트용 임시 예약 데이터 (나중에 ERD와 연결될 부분)
    const mockAppointments = [
        {
            id: 1,
            teacherName: 'David Kim',
            topic: '파열음 [p]/[b], [k]/[g] 발음 수업',
            date: '2026-01-31', // 테스트용
            time: '19:00',      // 입장 가능 테스트
            studentId: 'student_123',
            teacherId: 'teacher_99'
        },
        {
            id: 2,
            teacherName: 'Sarah Lee',
            topic: '긴 문장 강세 발음 연습',
            date: '2026-02-01', // 입장 불가 테스트
            time: '14:00',
            studentId: 'student_123',
            teacherId: 'teacher_55'
        }
    ];

    // 시간 1초마다 갱신
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 방 이름 해시 생성 함수
    const generateRoomHash = (appt) => {
        // 고유 문자열 조합
        const rawString = `${appt.date}_${appt.time}_${appt.studentId}_${appt.teacherId}`;
        // Base64 인코딩으로 해시처럼 보이게 만듦 (실제 프로젝트에선 sha256 등을 쓸 수도 있음)
        return btoa(rawString); 
    };

    // 5분 전 입장 체크
    const isClassTime = (dateStr, timeStr) => {
        const classStart = new Date(`${dateStr}T${timeStr}:00`);
        // 수업 시작 5분 전부터 입장 허용
        const entryStart = new Date(classStart.getTime() - 5 * 60 * 1000);
        // 현재 시간이 입장 가능 시간보다 지났는지 확인
        return currentTime >= entryStart;
    };

    // 입장 버튼 클릭
    const handleJoin = (appt) => {
        const roomId = generateRoomHash(appt);
        // console.log(`생성된 방 해시값(RoomID): ${roomId}`); // 디버깅용 코드
        navigate(`/tutoring/${roomId}`);
    };

    // 예약 페이지 이동 핸들러 (추후 구현)
    const handleBooking = () => {
        navigate('/tutoring/reserve');
    };

    return (
        <div className="lobby-container">

            {/* 1. 추천 튜터 섹션 */}
            <section className="tutor-section">
                {/* 상단 헤더: 제목 없이 버튼만 우측 배치 */}
                <div className="tutor-header">
                    <button className="more-btn" onClick={handleBooking}>
                        튜터링 예약하러 가기 &gt;
                    </button>
                </div>

                <div className="tutor-grid">
                    {mockTutors.map((tutor) => (
                        <div key={tutor.id} className="tutor-card" onClick={handleBooking}>
                            <div className="tutor-img-wrapper">
                                <div className="tutor-img-placeholder"></div>
                            </div>
                            <div className="tutor-info">
                                <h3 className="tutor-name">{tutor.name}</h3>
                                <p className="tutor-desc">{tutor.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 구분선 (간격 벌림) */}
            <div className="divider"></div>

            {/* 2. 나의 예약 목록 */}
            <section className="appointment-section">
                {/* 제목은 일정 위에만 존재 */}
                <h2 className="section-title">📅 나의 수업 일정</h2>
                
                <div className="appointment-list">
                    {mockAppointments.map((appt) => {
                        const available = isClassTime(appt.date, appt.time);
                        return (
                            <div key={appt.id} className="appointment-card">
                                <div className="card-info">
                                    <div className="card-date">
                                        {appt.date} <span className="time-badge">{appt.time}</span>
                                    </div>
                                    <h3 className="teacher-name">👨‍🏫 {appt.teacherName} 선생님</h3>
                                    <p className="class-topic">{appt.topic}</p>
                                </div>
                                <div className="card-action">
                                    <button
                                        onClick={() => handleJoin(appt)}
                                        disabled={!available} 
                                        className={`join-btn ${available ? 'active' : 'disabled'}`}
                                    >
                                        {available ? '입장하기' : '수업 5분 전 입장 가능'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

        </div>
    );
};

export default TutoringLobby;