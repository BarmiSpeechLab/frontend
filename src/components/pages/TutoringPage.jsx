import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../api/openviduApi';
import { getUserProfile } from '../../api/user';
import UserVideoComponent from '../common/UserVideoComponent';
import './TutoringPage.css';

const TutoringPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [session, setSession] = useState(undefined);
    const [mainStreamManager, setMainStreamManager] = useState(undefined);
    const [publisher, setPublisher] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [currentMember, setCurrentMember] = useState(null);

    // STT & 학생 기능 상태
    const [subtitles, setSubtitles] = useState('');
    const [isSTTActive, setIsSTTActive] = useState(false);
    const [sttLang, setSttLang] = useState('ko-KR');
    const [showSubtitles, setShowSubtitles] = useState(true);
    const subtitleTimerRef = useRef(null);
    
    // Refs
    const recognitionRef = useRef(null);
    const hasJoined = useRef(false);
    const publisherRef = useRef(undefined);
    const sessionRef = useRef(undefined);

    const ROLE = {
        TEACHER: 'teacher',
        STUDENT: 'student'
    };

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    // 유저 정보 (더미 데이터 주입)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const urlRole = searchParams.get('role'); 
                const TEST_ROLE = urlRole || 'teacher'; 

                setCurrentMember({
                    nickname: `테스트 ${TEST_ROLE === ROLE.TEACHER ? '선생님' : '학생'}`,
                    role: TEST_ROLE 
                });
            } catch (error) {
                console.error("API 에러 무시:", error);
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

    // 📡 시그널 수신 통합 (자막 + 학생 상태 알림)
    useEffect(() => {
        if (session) {
            // 1. 자막 수신
            session.on('signal:subtitle', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
                    
                    setSubtitles(data.text);
                    
                    subtitleTimerRef.current = setTimeout(() => {
                        setSubtitles('');
                    }, 3000);
                } catch (e) { console.error(e); }
            });

            // 2. 학생 상태 알림 수신 (선생님이 받음)
            session.on('signal:subtitleStatus', (event) => {
                if (event.data === 'OFF' && currentMember?.role === ROLE.TEACHER) {
                    alert("⚠️ 학생이 자막 기능을 껐습니다!");
                }
            });
        }
    }, [session]);

    // STT 시작 함수
    const startRecognition = (lang) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (recognitionRef.current) recognitionRef.current.abort();

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;

            if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);

            setSubtitles(transcript);

            subtitleTimerRef.current = setTimeout(() => {
                setSubtitles('');
            }, 3000);

            if (sessionRef.current) {
                sessionRef.current.signal({
                    data: JSON.stringify({ text: transcript, lang: lang }),
                    type: 'subtitle',
                }).catch(e => console.error(e));
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsSTTActive(true);
    };

    // 선생님용: 마이크/자막 동시 제어
    const toggleMicSTT = () => {
        if (!publisher) return;
        const currentAudioState = publisher.stream.audioActive;
        const nextAudioState = !currentAudioState;

        publisher.publishAudio(nextAudioState);

        if (nextAudioState === true) {
            startRecognition(sttLang);
        } else {
            if (recognitionRef.current) recognitionRef.current.abort();
            setIsSTTActive(false);
            setSubtitles('');
        }
    };

    // 🇰🇷🇺🇸 선생님용: 언어 변경
    const changeLang = (newLang) => {
        setSttLang(newLang);
        if (isSTTActive) startRecognition(newLang);
    };

    // 학생용: 자막 토글 & 알림 전송
    const toggleSubtitleVisibility = () => {
        const nextState = !showSubtitles;
        setShowSubtitles(nextState);

        if (nextState === false && sessionRef.current) {
            sessionRef.current.signal({
                data: 'OFF',
                type: 'subtitleStatus',
            }).catch(e => console.error(e));
        }
    };

    // 세션 입장
    const joinSession = async () => {
        const OV = new OpenVidu();
        const mySession = OV.initSession();
        setSession(mySession);
        sessionRef.current = mySession;

        // 구독 중 에러 발생 시 목록에서 제거
        mySession.on('exception', (exception) => {
            console.warn(exception);
            if (exception.name === 'ice-connection-failed' || exception.code === 102) {
                setSubscribers((prev) => prev.filter(sub => sub.stream.connection.connectionId !== exception.origin.connection.connectionId));
            }
        });

        mySession.on('streamCreated', (event) => {
            try {
                const subscriber = mySession.subscribe(event.stream, undefined);
                setSubscribers((prev) => [...prev, subscriber]);
            } catch (error) {
                console.warn("구독 실패 (유령 세션 무시):", error);
            }
        });

        mySession.on('streamDestroyed', (event) => {
            setSubscribers((prev) => prev.filter(sub => sub !== event.stream.streamManager));
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
        if (recognitionRef.current) recognitionRef.current.stop();
        if (publisherRef.current) {
            const stream = publisherRef.current.stream.getMediaStream();
            if (stream) stream.getTracks().forEach(track => track.stop());
            publisherRef.current = undefined;
        }
        if (sessionRef.current) sessionRef.current.disconnect();

        setSession(undefined);
        setSubscribers([]);
        setMainStreamManager(undefined);
        setPublisher(undefined);
        hasJoined.current = false;
        sessionRef.current = undefined;
        if (navigateExit) navigate('/tutoring');
    };

    useEffect(() => {
        const onBeforeUnload = () => leaveSession(false);
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            leaveSession(false);
        };
    }, []);

    return (
        <div className="subpage-container">
            {session && (
                <div className="control-panel">
                    {/* 선생님 UI */}
                    {currentMember?.role === ROLE.TEACHER && (
                        <>
                            <div className="lang-toggle-box">
                                <button onClick={() => changeLang('ko-KR')} className={`lang-btn ${sttLang === 'ko-KR' ? 'active ko' : ''}`}>🇰🇷 한국어</button>
                                <button onClick={() => changeLang('en-US')} className={`lang-btn ${sttLang === 'en-US' ? 'active en' : ''}`}>🇺🇸 English</button>
                            </div>
                            <button onClick={toggleMicSTT} className={`action-btn ${isSTTActive ? 'stt-on' : 'stt-off'}`}>
                                {isSTTActive ? '마이크 ON 🎙️' : '마이크 OFF 🔇'}
                            </button>
                        </>
                    )}

                    {/* 학생 UI (복구됨) */}
                    {currentMember?.role === ROLE.STUDENT && (
                        <button onClick={toggleSubtitleVisibility} className={`action-btn ${showSubtitles ? 'stt-on' : 'stt-off'}`}>
                            {showSubtitles ? '자막 보는 중 👀' : '자막 숨김 🙈'}
                        </button>
                    )}

                    <button onClick={() => leaveSession(true)} className="action-btn exit">나가기 🚪</button>
                </div>
            )}

            <h1 className="subpage-title">{session ? "💻 1:1 튜터링" : "강의실 입장 중..."}</h1>
            
            {!session ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h3>🚀 강의실에 입장하고 있습니다...</h3>
                </div>
            ) : (
                <div className="video-grid">
                    <div className="video-wrapper">
                        <h3 className="video-label">나 ({currentMember?.nickname})</h3>
                        {mainStreamManager ? <UserVideoComponent streamManager={mainStreamManager} /> : <div className="video-placeholder">카메라 로딩중...</div>}
                    </div>

                    <div className="video-wrapper">
                        <h3 className="video-label">선생님(상대방)</h3>
                        {subscribers.length === 0 ? (
                            <div className="waiting-box">⏳ 선생님을 기다리는 중...</div>
                        ) : (
                            subscribers.map((sub, i) => <UserVideoComponent key={i} streamManager={sub} />)
                        )}
                    </div>
                </div>
            )}

            {/* 자막: 내용이 있고 + (선생님이거나 || 학생이 보기를 켰을 때) 표시 */}
            {subtitles && (currentMember?.role === ROLE.TEACHER || showSubtitles) && (
                <div className="subtitle-overlay">
                    <span className="lang-badge">{sttLang === 'ko-KR' ? 'KO' : 'EN'}</span>
                    {subtitles}
                </div>
            )}
        </div>
    );
};

export default TutoringPage;