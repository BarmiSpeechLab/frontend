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

    // STT
    const [subtitles, setSubtitles] = useState('');
    const [isSTTActive, setIsSTTActive] = useState(false);
    const [sttLang, setSttLang] = useState('ko-KR');
    const subtitleTimerRef = useRef(null);
    
    // Refs
    const recognitionRef = useRef(null); // STT 객체
    const hasJoined = useRef(false);
    const publisherRef = useRef(undefined);
    const sessionRef = useRef(undefined); // 세션 Ref 추가

    // 역할 상수 정의 (나중에 확장 가능)
    const ROLE = {
        TEACHER: 'teacher',
        STUDENT: 'student'
    };

    // 세션 상태 동기화
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await getUserProfile();
                console.log("🔍 내 정보 전체 확인:", response.data);
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

    // 상대방이 보낸 자막 수신 (학생용)
    useEffect(() => {
        if (session) {
            session.on('signal:subtitle', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // 1. 기존에 돌고 있던 '지우기 타이머'가 있다면 취소
                    if (subtitleTimerRef.current) {
                        clearTimeout(subtitleTimerRef.current);
                    }

                    // 2. 자막 업데이트
                    setSubtitles(data.text);
                    
                    // 3. 마지막 입력으로부터 3초 뒤에 지우도록 타이머 재설정
                    subtitleTimerRef.current = setTimeout(() => {
                        setSubtitles('');
                    }, 3000);

                } catch (e) {
                    console.error("자막 파싱 에러:", e);
                }
            });
        }
    }, [session]);

    // STT 시작/재시작 함수
    const startRecognition = (lang) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("크롬 브라우저에서만 자막 기능을 사용할 수 있습니다.");
            return;
        }

        if (recognitionRef.current) recognitionRef.current.abort();

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;

            // 1. 기존 타이머 취소
            if (subtitleTimerRef.current) {
                clearTimeout(subtitleTimerRef.current);
            }

            // 2. 내 화면 업데이트
            setSubtitles(transcript);

            // 3. 내 화면 지우기 타이머 재설정 (3초)
            subtitleTimerRef.current = setTimeout(() => {
                setSubtitles('');
            }, 3000);

            // -------------------------

            // 4. 상대방 전송
            if (sessionRef.current) {
                const signalData = JSON.stringify({ text: transcript, lang: lang });
                sessionRef.current.signal({
                    data: signalData,
                    type: 'subtitle',
                }).catch(e => console.error(e));
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'aborted') return;
            console.error("STT Error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsSTTActive(true);
    };

    // 자막 켜기/끄기 토글
    const toggleSTT = () => {
        if (isSTTActive) {
            // 강제 종료
            if (recognitionRef.current) recognitionRef.current.abort();
            setIsSTTActive(false);
            setSubtitles(''); // 끄면 자막도 즉시 지움
        } else {
            // 현재 설정된 언어로 시작
            startRecognition(sttLang);
        }
    };

    // KR/US 언어 변경 핸들러
    const changeLang = (newLang) => {
        setSttLang(newLang); // UI 상태 변경
        
        // 만약 자막이 켜져있는 상태라면, '바뀐 언어'로 즉시 재시작
        if (isSTTActive) {
            console.log(`언어 변경 감지: ${newLang}로 재시작합니다.`);
            startRecognition(newLang);
        }
    };

    // 세션 입장
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

    // 세션 나가기
    const leaveSession = (navigateExit = true) => {
        // 0. STT 끄기
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

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
        <div className="subpage-container">
            
            {/* 세션이 연결되었을 때만 버튼 표시 */}
            {session && (
                <div className="control-panel">
                    {/* 1. 언어 선택 토글 (자막이 켜져있을 때만 활성화해도 됨) */}
                    <div className="lang-toggle-box">
                        <button 
                                onClick={() => changeLang('ko-KR')}
                                className={`lang-btn ${sttLang === 'ko-KR' ? 'active ko' : ''}`}
                        >
                            🇰🇷
                        </button>
                        <button 
                            onClick={() => changeLang('en-US')}
                            className={`lang-btn ${sttLang === 'en-US' ? 'active en' : ''}`}
                        >
                            🇺🇸
                        </button>
                    </div>

                    {/* 2. 자막 ON/OFF 버튼 */}
                    <button 
                        onClick={toggleSTT} 
                        className={`action-btn ${isSTTActive ? 'stt-on' : 'stt-off'}`}
                    >
                        {isSTTActive ? '자막 끄기 🔇' : '자막 켜기 🎙️'}
                    </button>

                    {/* 3. 나가기 버튼 */}
                    <button 
                        onClick={() => leaveSession(true)} 
                        className="action-btn exit"
                    >
                        나가기 🚪
                    </button>
                </div>
            )}

            <h1 className="subpage-title">
                {session ? "💻 1:1 튜터링" : "강의실 입장 중..."}
            </h1>
            
            {!session ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h3>🚀 강의실에 입장하고 있습니다...</h3>
                    <p>잠시만 기다려 주세요.</p>
                </div>
            ) : (
                <div className="video-grid">
                    
                    {/* 나 */}
                    <div className="video-wrapper">
                        <h3 className="video-label">나 ({currentMember?.nickname})</h3>
                        {mainStreamManager ? (
                            <UserVideoComponent streamManager={mainStreamManager} />
                        ) : (
                            <div className="video-placeholder">카메라 로딩중...</div>
                        )}
                    </div>

                    {/* 상대방 */}
                    <div className="video-wrapper">
                        <h3 className="video-label">선생님(상대방)</h3>
                        {subscribers.length === 0 ? (
                            <div className="waiting-box">
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

            {/* 자막 표시 영역 */}
            {subtitles && (
                <div className="subtitle-overlay">
                    <span className="lang-badge">
                        {sttLang === 'ko-KR' ? 'KO' : 'EN'}
                    </span>
                    {subtitles}
                </div>
            )}
        </div>
    );
};

export default TutoringPage;