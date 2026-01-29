import React, { useState, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../api/openviduApi'; // API 경로
import UserVideoComponent from '../common/UserVideoComponent'; // 컴포넌트 경로
import './SubPage.css';

const TutoringPage = () => {
    // 1. 상태 관리 (OpenVidu 관련)
    const [session, setSession] = useState(undefined);
    const [mainStreamManager, setMainStreamManager] = useState(undefined);
    const [publisher, setPublisher] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [OV, setOV] = useState(undefined);

    // 2. OpenVidu 객체 생성
    useEffect(() => {
        const newOV = new OpenVidu();
        setOV(newOV);
    }, []);

    // 3. 화상 채팅 입장 로직
    const joinSession = async () => {
        const mySession = OV.initSession();
        setSession(mySession);

        // 상대방이 들어왔을 때
        mySession.on('streamCreated', (event) => {
            const subscriber = mySession.subscribe(event.stream, undefined);
            setSubscribers((prev) => [...prev, subscriber]);
        });

        try {
            const mySessionId = 'TutoringSession'; // 고정 세션 ID

            // API 호출
            await createSession(mySessionId);
            const token = await createToken(mySessionId);

            // 세션 접속
            await mySession.connect(token, { clientData: 'MyNickname' }); // 닉네임 설정

            // 내 카메라 송출
            const newPublisher = await OV.initPublisherAsync(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: '640x480',
                frameRate: 30,
                insertMode: 'APPEND',
                mirror: false,
            });

            mySession.publish(newPublisher);
            setMainStreamManager(newPublisher);
            setPublisher(newPublisher);

        } catch (error) {
            console.error('세션 접속 실패:', error);
            alert('화상 연결 실패했습니다.(백엔드/도커 확인 필요)');
        }
    };

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">튜터링</h1>
            <p className="subpage-desc">1:1 화상 채팅으로 실시간 발음 교정을 받아보세요.</p>

            {/* --- 입장 전 상태 --- */}
            {!session ? (
                <div className="tutor-list" style={{ textAlign: 'center', marginTop: '50px' }}>
                    {/* 지금은 튜터 리스트 대신 '입장 버튼'을 보여줍니다 */}
                    <div style={{ padding: '30px', border: '2px dashed #ccc', borderRadius: '10px' }}>
                        <h3>🚀 수업 시작하기</h3>
                        <p>버튼을 누르면 화상 강의실로 입장합니다.</p>
                        <button
                            onClick={joinSession}
                            style={{
                                padding: '15px 40px',
                                fontSize: '18px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            강의실 입장
                        </button>
                    </div>
                </div>
            ) : null}

            {/* --- 입장 후 상태 (화상 화면) --- */}
            {session && (
                <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* 1. 내 화면 */}
                    <div style={{ width: '400px' }}>
                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>👱 나 (학생)</div>
                        <UserVideoComponent streamManager={mainStreamManager} />
                    </div>

                    {/* 2. 상대방 화면 (반복문) */}
                    {subscribers.map((sub, i) => (
                        <div key={i} style={{ width: '400px' }}>
                            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>👩‍🏫 선생님</div>
                            <UserVideoComponent streamManager={sub} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TutoringPage;