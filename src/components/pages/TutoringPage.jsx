import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../api/openviduApi';
import { getUserProfile } from '../../api/user';
import UserVideoComponent from '../common/UserVideoComponent';
import './SubPage.css';

const TutoringPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [session, setSession] = useState(undefined);
    const [mainStreamManager, setMainStreamManager] = useState(undefined);
    const [publisher, setPublisher] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [currentMember, setCurrentMember] = useState(null);

    // Refs
    const hasJoined = useRef(false);
    const publisherRef = useRef(undefined);
    const sessionRef = useRef(undefined); // 세션 Ref 추가

    // 세션 상태 동기화
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await getUserProfile();
                setCurrentMember(response.data || { nickname: '익명' });
            } catch (error) {
                console.error("유저 정보 조회 실패", error);
                setCurrentMember({ nickname: 'Guest' });
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (roomId && currentMember && !hasJoined.current) {
            hasJoined.current = true;
            joinSession();
        }
    }, [roomId, currentMember]);

    const joinSession = async () => {
        const OV = new OpenVidu();
        const mySession = OV.initSession();
        setSession(mySession);
        sessionRef.current = mySession; // 즉시 할당

        mySession.on('streamCreated', (event) => {
            const subscriber = mySession.subscribe(event.stream, undefined);
            setSubscribers((prev) => [...prev, subscriber]);
        });

        mySession.on('streamDestroyed', (event) => {
            setSubscribers((prev) => prev.filter(sub => sub !== event.stream.streamManager));
        });

        mySession.on('exception', (exception) => {
            console.warn(exception);
        });

        try {
            await createSession(roomId);
            const token = await createToken(roomId);
            await mySession.connect(token, { clientData: currentMember.nickname });

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
            publisherRef.current = newPublisher;

        } catch (error) {
            console.error('입장 실패:', error);
            alert('입장에 실패했습니다.');
            navigate('/tutoring');
        }
    };

    const leaveSession = (navigateExit = true) => {
        // 1. 카메라 끄기
        if (publisherRef.current) {
            const stream = publisherRef.current.stream.getMediaStream();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            publisherRef.current = undefined;
        }

        // 2. 세션 끊기 (Ref 사용)
        if (sessionRef.current) {
            sessionRef.current.disconnect();
        }

        // 3. 상태 초기화
        setSession(undefined);
        setSubscribers([]);
        setMainStreamManager(undefined);
        setPublisher(undefined);
        hasJoined.current = false;
        sessionRef.current = undefined;

        // 4. 페이지 이동은 버튼 클릭 시에만 수행
        if (navigateExit) {
            navigate('/tutoring');
        }
    };

    // 페이지 이동 시에는 리소스만 정리
    useEffect(() => {
        const onBeforeUnload = () => leaveSession(false); // 새로고침 시 이동 X
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            leaveSession(false); // 컴포넌트 해제 시 이동 X
        };
    }, []);

    return (
        <div className="subpage-container" style={{ position: 'relative' }}>
            
            {session && (
                <button onClick={leaveSession} style={styles.exitBtn}>
                    나가기 🚪
                </button>
            )}

            <h1 className="subpage-title">
                {session ? "💻 1:1 튜터링" : "강의실 입장 중..."}
            </h1>
            
            {!session ? (
                <div style={styles.loadingContainer}>
                    <div className="spinner"></div>
                    <h3>🚀 강의실에 입장하고 있습니다...</h3>
                    <p>잠시만 기다려 주세요.</p>
                </div>
            ) : (
                <div className="video-grid" style={styles.videoGrid}>
                    
                    {/* 나 */}
                    <div className="video-wrapper" style={styles.videoWrapper}>
                        <h3 className="video-label">나 ({currentMember?.nickname})</h3>
                        {mainStreamManager ? (
                            <UserVideoComponent streamManager={mainStreamManager} />
                        ) : (
                            <div className="video-placeholder">카메라 로딩중...</div>
                        )}
                    </div>

                    {/* 상대방 */}
                    <div className="video-wrapper" style={styles.videoWrapper}>
                        <h3 className="video-label">선생님(상대방)</h3>
                        {subscribers.length === 0 ? (
                            <div style={styles.waitingBox}>
                                ⏳ 선생님을 기다리는 중...
                            </div>
                        ) : (
                            subscribers.map((sub, i) => (
                                <UserVideoComponent key={i} streamManager={sub} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 스타일
const styles = {
    loadingContainer: {
        textAlign: 'center',
        marginTop: '100px',
        color: '#666',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
    },
    videoGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        marginTop: '30px',
        width: '100%',
        maxWidth: '1200px',
        margin: '30px auto'
    },
    
    videoWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: '1 1 400px', 
        maxWidth: '600px',
        minWidth: '320px',
        padding: '10px',
        boxSizing: 'border-box'
    },

    waitingBox: {
        width: '100%',
        height: '240px',
        minHeight: '240px',
        backgroundColor: '#f0f0f0',
        border: '2px dashed #ccc',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        fontWeight: 'bold'
    },
    
    exitBtn: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '8px 16px',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }
};

export default TutoringPage;