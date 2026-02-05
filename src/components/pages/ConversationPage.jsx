import React, { useState, useRef, useEffect } from 'react';
import { startConversation, submitConversation, checkConversationStatus } from '../../api/conversation';
import './ConversationPage.css';

// Avatar 이미지 import
import avatarWaiting from '../../assets/img/conversation_waiting.png';
import avatarSuccess from '../../assets/img/conversation_success.png';
import avatarThinking from '../../assets/img/conversation_thinking.png';
import avatarFail from '../../assets/img/conversation_fail.png';

const THEMES = [
    { id: 'DAILY', label: '일상', emoji: '🏠' },
    { id: 'TRAVEL', label: '여행', emoji: '✈️' },
    { id: 'FOOD', label: '음식', emoji: '🍔' },
    { id: 'SHOPPING', label: '쇼핑', emoji: '🛍️' },
    { id: 'BUSINESS', label: '비즈니스', emoji: '💼' }
];

const ConversationPage = () => {
    const [currentTheme, setCurrentTheme] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastAiQuestion, setLastAiQuestion] = useState('');
    const [avatarState, setAvatarState] = useState('waiting');
    const [showFailMessage, setShowFailMessage] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isProcessing]);

    const getAvatarImage = () => {
        switch (avatarState) {
            case 'success': return avatarSuccess;
            case 'thinking': return avatarThinking;
            case 'fail': return avatarFail;
            default: return avatarWaiting;
        }
    };

    const handleThemeChange = async (themeId) => {
        if (isRecording || isProcessing) return;

        setCurrentTheme(themeId);
        setMessages([]);
        setLastAiQuestion('');
        setAvatarState('thinking');
        setShowFailMessage(false);
        setIsProcessing(true);

        try {
            const response = await startConversation(themeId);
            const firstQuestion = response.message;

            setMessages([{ type: 'AI', text: firstQuestion }]);
            setLastAiQuestion(firstQuestion);
            setAvatarState('waiting');
        } catch (error) {
            console.error(error);
            setMessages([{ type: 'AI', text: '주제 시작 중 오류가 발생했습니다.' }]);
            setAvatarState('fail');
        } finally {
            setIsProcessing(false);
        }
    };

    const startRecording = async () => {
        if (!currentTheme) {
            alert("주제를 먼저 선택해주세요!");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleAudioSubmit(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            alert("마이크 권한이 필요합니다.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioSubmit = async (audioBlob) => {
        setIsProcessing(true);
        setAvatarState('thinking');
        setShowFailMessage(false);

        try {
            const { taskId } = await submitConversation(audioBlob, lastAiQuestion, currentTheme);
            const result = await pollConversationResult(taskId, 30);

            if (result.status === 'ERROR') {
                setAvatarState('fail');
                throw new Error(result.error || '분석 중 오류가 발생했습니다.');
            }

            const { transScript, nextTurn, feedback } = result.analysisResult;

            if (nextTurn === lastAiQuestion) {
                setAvatarState('fail');
                setShowFailMessage(true);

                setTimeout(() => {
                    setShowFailMessage(false);
                    setAvatarState('waiting');
                }, 3000);

                return;
            }

            setAvatarState('success');
            setMessages(prev => [
                ...prev,
                { type: 'USER', text: transScript },
                { type: 'AI_FEEDBACK', text: feedback },
                { type: 'AI', text: nextTurn }
            ]);

            setLastAiQuestion(nextTurn);

            setTimeout(() => {
                setAvatarState('waiting');
            }, 1000);

        } catch (error) {
            console.error(error);
            setAvatarState('fail');
            setMessages(prev => [...prev, { type: 'AI', text: "오류가 발생했습니다. 다시 시도해주세요." }]);

            setTimeout(() => {
                setAvatarState('waiting');
            }, 2000);
        } finally {
            setIsProcessing(false);
        }
    };

    const pollConversationResult = async (taskId, maxAttempts = 30) => {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await checkConversationStatus(taskId);

            if (result.status === 'SUCCESS' || result.status === 'ERROR') {
                return result;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error('분석 시간이 초과되었습니다.');
    };


    return (
        <div className="conversation-container">
            {/* 헤더 + 주제 선택 */}
            <div className="conversation-header">
                <div className="header-top">
                    <h1 className="header-title">바르미와 대화하기</h1>
                    <p className="header-subtitle">자유롭게 대화하며 발음을 연습하세요</p>
                </div>

                {/* 주제 버튼 (작은 칩 형태) */}
                <div className="theme-chips">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            className={`theme-chip ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => handleThemeChange(theme.id)}
                            disabled={isRecording || isProcessing}
                        >
                            <span className="chip-emoji">{theme.emoji}</span>
                            <span className="chip-label">{theme.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 메인 컨텐츠 (아바타 왼쪽 + 채팅 오른쪽) */}
            <div className="conversation-main">
                {/* 왼쪽: Avatar */}
                <div className="avatar-sidebar">
                    <div className="avatar-container">
                        <img
                            src={getAvatarImage()}
                            alt="바르미"
                            className={`avatar-image ${avatarState}`}
                        />
                        {showFailMessage && (
                            <div className="fail-message">
                                <p>죄송해요, 다시 한 번 말씀해주세요 😅</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 채팅 영역 */}
                <div className="chat-area">
                    <div className="chat-messages">
                        {messages.length === 0 && !isProcessing && (
                            <div className="empty-state">
                                <p>👆 위에서 주제를 선택하면<br />바르미가 먼저 말을 걸어줘요!</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.type.toLowerCase()}`}>
                                {msg.type === 'AI_FEEDBACK' && (
                                    <div className="feedback-badge">발음 피드백</div>
                                )}
                                <div className="message-bubble">
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isProcessing && messages.length > 0 && (
                            <div className="message ai">
                                <div className="message-bubble processing">
                                    분석 중입니다...
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* 녹음 버튼 */}
                    <div className="recording-controls">
                        <button
                            className={`record-button ${isRecording ? 'recording' : ''} ${isProcessing || !currentTheme ? 'disabled' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing || !currentTheme}
                        >
                            {isRecording ? (
                                <>
                                    <span className="record-icon recording-pulse"></span>
                                    <span>녹음 중... (클릭하여 종료)</span>
                                </>
                            ) : (
                                <>
                                    <span className="record-icon"></span>
                                    <span>{!currentTheme ? '주제를 먼저 선택하세요' : '답변 녹음하기'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationPage;