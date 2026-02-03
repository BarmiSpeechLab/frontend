import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitPronunciation, checkAnalysisStatus } from '../../api/ai';
import './PronunciationPracticePage.css';

const LearningPracticePage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 상태 관리
    const state = location.state || {};
    const { topic, mode = 'WORD', step = 0 } = state;

    // 현재 아이템 (단어 or 문장)
    const items = mode === 'WORD' ? topic.words : topic.sentences;
    const currentItem = items[step];

    const [isRecording, setIsRecording] = useState(false);
    const [accumulatedResults, setAccumulatedResults] = useState(state.accumulatedResults || []);

    // 녹음용 Ref
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // 아이템 없으면 뒤로
    useEffect(() => {
        if (!currentItem) {
            alert('학습할 데이터가 없습니다.');
            navigate('/learning');
        }
    }, [currentItem, navigate]);

    // 녹음
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleRecordingComplete(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
            alert("마이크 권한이 필요합니다.");
        }
    };

    //
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleRecordingComplete = async (audioBlob) => {
        // 1. 더미 분석 (임시)
        // 나중에 여기서 blob -> 서버로 전송
        const audioUrl = URL.createObjectURL(audioBlob);

        // 더미 결과
        const mockResult = {
            item: currentItem,
            userAudioUrl: audioUrl,
            grade: 'EXCELLENT',
            score: 95,
            feedback: '완벽합니다 ..'
        };

        // 2. 다음 단계
        const newResults = [...accumulatedResults, mockResult];

        if (step + 1 < items.length) {
            // 다음 아이템으로 이동
            navigate('/learning/practice', {
                state: {
                    ...state,
                    step: step + 1,
                    accumulatedResults: newResults
                },
                replace: true
            });
        } else {
            // 현재 단계 학습 완료
            navigate('/learning/result', {
                state: {
                    topic: topic,
                    mode: mode,
                    results: newResults
                }
            });
        }
    };

    if (!currentItem) return <div>Loading...</div>;

    return (
        <div className="practice-container">
            <div className="practice-header">
                <span className="mode-badge">{mode === 'WORD' ? '단어 학습' : '문장 학습'}</span>
                <h1 className="practice-title">{currentItem.word || currentItem.sentence}</h1>
                <p className="practice-subtitle">
                    {currentItem.meaning}
                    <br />
                    <span style={{ fontSize: '0.9rem', color: '#888' }}>
                        {currentItem.pronounciation || currentItem.guide}
                    </span>
                </p>
            </div>

            <div className="practice-visuals">
                <div className="visual-box" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {topic.bgImage && (
                        <img
                            src={topic.bgImage}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', opacity: 0.8 }}
                            alt="Topic"
                        />
                    )}
                </div>
            </div>

            <div className="practice-controls">
                <p style={{ marginBottom: '10px' }}>{step + 1} / {items.length}</p>
                <button
                    className={`record-btn-large ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                >
                    {isRecording ? '⏹' : '🎤'}
                </button>
                <p style={{ marginTop: '1rem', color: '#ccc' }}>
                    {isRecording ? '녹음 중...' : '버튼을 눌러 따라 읽어보세요.'}
                </p>
            </div>
        </div>
    );
};

export default LearningPracticePage;
