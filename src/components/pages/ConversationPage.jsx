import React, { useState, useRef, useEffect } from 'react';
import { startConversation, sendConversationAudio } from '../../api/conversation'; // startConversation 추가
import './ConversationPage.css';

const THEMES = [
    { id: 'DAILY', label: '일상 🏠' },
    { id: 'TRAVEL', label: '여행 ✈️' },
    { id: 'FOOD', label: '음식 🍔' },
    { id: 'SHOPPING', label: '쇼핑 🛍️' },
    { id: 'BUSINESS', label: '비즈니스 💼' }
];

const ConversationPage = () => {
    const [currentTheme, setCurrentTheme] = useState(null); // 초기값 null (선택 안 함)
    const [messages, setMessages] = useState([]); 
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const chatEndRef = useRef(null);

    // 스크롤 자동 내리기
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isProcessing]);

    // ⭐ 주제 변경 핸들러 (수정됨)
    const handleThemeChange = async (themeId) => {
        if (isRecording || isProcessing) return; // 녹음/처리 중 변경 방지

        setCurrentTheme(themeId);
        setMessages([]); // 기존 대화 초기화
        setIsProcessing(true); // 로딩 표시

        try {
            // 1. 첫 질문 가져오기
            const response = await startConversation(themeId);
            
            // 2. AI 질문 메시지 추가
            setMessages([
                { type: 'AI', text: response.message }
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // ... (startRecording, stopRecording 등 기존 로직 동일) ...
    // ... 녹음 관련 코드는 이전 답변과 같습니다 ...
    
    // 녹음 시작
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
        try {
            const response = await sendConversationAudio(audioBlob, currentTheme);
            const { transScript, feedback, nextTurn } = response.analysisResult;

            setMessages(prev => [
                ...prev,
                { type: 'USER', text: transScript },
                { type: 'AI_FEEDBACK', text: feedback },
                { type: 'AI', text: nextTurn }
            ]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { type: 'AI', text: "오류가 발생했습니다." }]);
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="conversation-container">
            {/* 1. 상단 주제 탭 */}
            <div className="theme-header">
                <div className="theme-scroll">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            className={`theme-chip ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => handleThemeChange(theme.id)}
                        >
                            {theme.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. 채팅 영역 */}
            <div className="chat-area">
                {/* ⭐ 주제 선택 전 안내 문구 (messages가 비어있을 때) */}
                {messages.length === 0 && !isProcessing && (
                    <div className="empty-state">
                        <div className="empty-icon">👆</div>
                        <h3>주제를 선택해주세요</h3>
                        <p>원하는 주제를 클릭하면<br/>AI가 먼저 말을 걸어줍니다.</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.type.startsWith('USER') ? 'user-row' : 'ai-row'}`}>
                        {!msg.type.startsWith('USER') && <div className="ai-avatar">🤖</div>}
                        <div className={`bubble ${msg.type}`}>
                            {msg.type === 'AI_FEEDBACK' && <div className="feedback-label">📝 피드백</div>}
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {/* 로딩 인디케이터 */}
                {isProcessing && (
                    <div className="message-row ai-row">
                        <div className="ai-avatar">🤖</div>
                        <div className="bubble AI processing">
                            {currentTheme && messages.length === 0 ? "질문 생성 중..." : "분석 중..."} 💬
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* 3. 하단 컨트롤러 */}
            <div className="control-bar">
                <button 
                    className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing || !currentTheme ? 'disabled' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || !currentTheme} 
                >
                    {isRecording ? (
                        <span className="recording-ani">⏹ 종료 (녹음 중...)</span>
                    ) : (
                        <span>
                            {!currentTheme ? '👆 주제를 먼저 선택하세요' : '🎤 답변 녹음하기'}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConversationPage;