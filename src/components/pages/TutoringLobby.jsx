import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TutoringLobby.css'; // 스타일 파일 분리

const TutoringLobby = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

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

    // 시간을 1초마다 갱신 (실시간 버튼 활성화를 위해)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. 방 이름 해시 생성 함수 (날짜+시간+학생ID+선생ID)
    const generateRoomHash = (appt) => {
        // 고유 문자열 조합
        const rawString = `${appt.date}_${appt.time}_${appt.studentId}_${appt.teacherId}`;
        // Base64 인코딩으로 해시처럼 보이게 만듦 (실제 프로젝트에선 sha256 등을 쓸 수도 있음)
        return btoa(rawString); 
    };

    // 3. 수업 시간 체크 함수
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

    return (
        <div className="lobby-container">
            <h1 className="lobby-title">📅 나의 수업 일정</h1>
            
            <div className="appointment-list">
                {mockAppointments.map((appt) => {
                    const available = isClassTime(appt.date, appt.time);
                    
                    return (
                        <div key={appt.id} className="appointment-card">
                            {/* 왼쪽: 날짜 및 시간 정보 */}
                            <div className="card-info">
                                <div className="card-date">
                                    {appt.date} <span className="time-badge">{appt.time}</span>
                                </div>
                                <h3 className="teacher-name">👨‍🏫 {appt.teacherName} 선생님</h3>
                                <p className="class-topic">{appt.topic}</p>
                            </div>

                            {/* 오른쪽: 입장 버튼 */}
                            <div className="card-action">
                                <button
                                    onClick={() => handleJoin(appt)}
                                    disabled={!available} // 시간이 안 되면 버튼 비활성화
                                    className={`join-btn ${available ? 'active' : 'disabled'}`}
                                >
                                    {available ? '입장하기' : '수업 시간이 아닙니다'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TutoringLobby;