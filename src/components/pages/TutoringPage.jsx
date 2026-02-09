import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '../../api/openviduApi';
import { getIpaRadarStats, getIpaAiReport } from '../../api/user';
import UserVideoComponent from '../common/UserVideoComponent';
import PronunciationWeaknessRadar from '../common/PronunciationWeaknessRadar';
import AiFeedback from '../common/AiFeedback';
import ReportModal from '../common/ReportModal';
import './TutoringPage.css';


// ----------------------------------------------------------------------------
// TutoringPage 컴포넌트
// ----------------------------------------------------------------------------

const TutoringPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(undefined);
    const [mainStreamManager, setMainStreamManager] = useState(undefined);
    const [publisher, setPublisher] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);
    const [currentMember, setCurrentMember] = useState(null);

    // 튜터 전용: 학생 관리 상태
    const [studentId, setStudentId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // STT & 학생 기능 상태
    const [subtitles, setSubtitles] = useState('');
    const [isSTTActive, setIsSTTActive] = useState(false);
    const [sttLang, setSttLang] = useState('ko-KR');
    const [showSubtitles, setShowSubtitles] = useState(true);

    // Refs
    const subtitleTimerRef = useRef(null);
    const recognitionRef = useRef(null);
    const hasJoined = useRef(false);
    const publisherRef = useRef(undefined);
    const sessionRef = useRef(undefined);

    // 역할 상수 (DB 값 기준)
    const ROLE = {
        TEACHER: 'TUTOR',
        STUDENT: 'USER'
    };

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    // 실제 API 호출로 사용자 정보 가져오기
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const storedRole = localStorage.getItem('userRole');
        const storedNickname = localStorage.getItem('userNickname');
        const storedId = localStorage.getItem('userId');

        console.log(`로컬 정보로 입장: ${storedNickname} / ${storedRole} (ID: ${storedId})`);

        setCurrentMember({
            id: storedId,
            nickname: storedNickname,
            role: storedRole
        });

    }, [navigate]);

    // 방 입장 로직
    useEffect(() => {
        if (roomId && currentMember && !hasJoined.current) {
            hasJoined.current = true;
            joinSession();
        }
    }, [roomId, currentMember]);

    // 시그널 수신 통합
    useEffect(() => {
        if (session) {
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

            session.on('signal:subtitleStatus', (event) => {
                if (event.data === 'OFF' && currentMember?.role === ROLE.TEACHER) {
                    alert("학생이 자막 기능을 껐습니다!");
                }
            });

            // 학생 정보를 받는 시그널 추가 (선생님 전용)
            session.on('signal:studentInfo', (event) => {
                if (currentMember?.role === ROLE.TEACHER) {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('학생 ID 수신:', data.userId);
                        setStudentId(data.userId);
                    } catch (e) { console.error('학생 정보 파싱 에러', e); }
                }
            });

            // 선생님이 들어왔을 때 이미 들어와있던 학생이 정보를 다시 쏘도록 함
            session.on('signal:requestInfo', () => {
                if (currentMember?.role === ROLE.STUDENT) {
                    sendInfoSignal();
                }
            });
        }
    }, [session, currentMember]);

    // 정보 송신 시그널
    const sendInfoSignal = () => {
        if (sessionRef.current && currentMember?.role === ROLE.STUDENT) {
            sessionRef.current.signal({
                data: JSON.stringify({ userId: currentMember.id }),
                type: 'studentInfo'
            }).catch(e => console.error(e));
        }
    };

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

    const changeLang = (newLang) => {
        setSttLang(newLang);
        if (isSTTActive) startRecognition(newLang);
    };

    const toggleSubtitleVisibility = () => {
        const nextState = !showSubtitles;
        setShowSubtitles(nextState);

        if (nextState === false && sessionRef.current) {
            sessionRef.current.signal({ data: 'OFF', type: 'subtitleStatus' }).catch(e => console.error(e));
        }
    };

    const joinSession = async () => {
        const OV = new OpenVidu();
        const mySession = OV.initSession();
        setSession(mySession);
        sessionRef.current = mySession;

        mySession.on('exception', (exception) => {
            if (exception.name === 'ice-connection-failed' || exception.code === 102) {
                setSubscribers((prev) => prev.filter(sub => sub.stream.connection.connectionId !== exception.origin.connection.connectionId));
            }
        });

        mySession.on('streamCreated', (event) => {
            try {
                const subscriber = mySession.subscribe(event.stream, undefined);
                setSubscribers((prev) => [...prev, subscriber]);

                // 새로운 스트림이 생겼을 때 (상대방 입장 등) 정보 요청
                if (currentMember?.role === ROLE.TEACHER) {
                    mySession.signal({ type: 'requestInfo' }).catch(() => { });
                }
                if (currentMember?.role === ROLE.STUDENT) {
                    sendInfoSignal();
                }
            } catch (error) {
                console.warn("구독 실패:", error);
            }
        });

        mySession.on('streamDestroyed', (event) => {
            setSubscribers((prev) => prev.filter(sub => sub !== event.stream.streamManager));
            // 학생이 나가면 ID 초기화
            if (currentMember?.role === ROLE.TEACHER) {
                setStudentId(null);
                setIsModalOpen(false);
            }
        });

        try {
            await createSession(roomId);
            const token = await createToken(roomId);
            await mySession.connect(token, { clientData: currentMember.nickname });

            const newPublisher = await OV.initPublisherAsync(undefined, {
                audioSource: undefined, videoSource: undefined,
                publishAudio: true, publishVideo: true,
                resolution: '640x480', frameRate: 30,
                insertMode: 'APPEND', mirror: false,
            });

            mySession.publish(newPublisher);
            setMainStreamManager(newPublisher);
            setPublisher(newPublisher);
            publisherRef.current = newPublisher;

            // 입장 직후 학생이라면 정보 전송 시도
            if (currentMember?.role === ROLE.STUDENT) {
                setTimeout(sendInfoSignal, 1000);
            }

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
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className={`action-btn ${studentId ? 'stt-on' : 'stt-off'}`}
                                disabled={!studentId}
                            >
                                {studentId ? '학생 리포트 보기' : '학생 대기 중'}
                            </button>
                            <div className="lang-toggle-box">
                                <button onClick={() => changeLang('ko-KR')} className={`lang-btn ${sttLang === 'ko-KR' ? 'active ko' : ''}`}>🇰🇷 한국어</button>
                                <button onClick={() => changeLang('en-US')} className={`lang-btn ${sttLang === 'en-US' ? 'active en' : ''}`}>🇺🇸 English</button>
                            </div>
                            <button onClick={toggleMicSTT} className={`action-btn ${isSTTActive ? 'stt-on' : 'stt-off'}`}>
                                {isSTTActive ? '마이크 ON' : '마이크 OFF'}
                            </button>
                        </>
                    )}

                    {/* 학생 UI */}
                    {currentMember?.role === ROLE.STUDENT && (
                        <button onClick={toggleSubtitleVisibility} className={`action-btn ${showSubtitles ? 'stt-on' : 'stt-off'}`}>
                            {showSubtitles ? '자막 보는 중' : '자막 숨김'}
                        </button>
                    )}

                    <button onClick={() => leaveSession(true)} className="action-btn exit">나가기</button>
                </div>
            )}

            <h1 className="subpage-title">1:1 튜터링</h1>

            {!session ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h3>강의실에 입장 중 ...</h3>
                </div>
            ) : (
                <div className="video-grid">
                    <div className="video-wrapper">
                        <h3 className="video-label">나</h3>
                        {mainStreamManager ? <UserVideoComponent streamManager={mainStreamManager} /> : <div className="video-placeholder">카메라 로딩중 ...</div>}
                    </div>
                    <div className="video-wrapper">
                        <h3 className="video-label">{currentMember?.role === ROLE.TEACHER ? '학생' : '선생님'}</h3>
                        {subscribers.length === 0 ? (
                            <div className="waiting-box">상대방을 기다리는 중 ...</div>
                        ) : (
                            subscribers.map((sub, i) => <UserVideoComponent key={i} streamManager={sub} />)
                        )}
                    </div>
                </div>
            )}

            {subtitles && (currentMember?.role === ROLE.TEACHER || showSubtitles) && (
                <div className="subtitle-overlay">
                    <span className="lang-badge">{sttLang === 'ko-KR' ? 'KO' : 'EN'}</span>
                    {subtitles}
                </div>
            )}

            {isModalOpen && studentId && (
                <ReportModal
                    studentId={studentId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TutoringPage;
