import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


import './PronunciationPracticePage.css';
import { submitPronunciation, checkAnalysisStatus, getLocalMockResult } from '../../api/ai';

const PronunciationPracticePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state || {
        symbol: 'ɑ',
        word: 'car',
        // nativeVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        // mouthShapeUrl: '/itachi.jpg',
        // tonguePositionUrl: '/itachi.jpg'
    }; // 기본값

    const [isRecording, setIsRecording] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // 목표 억양 시각화
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // 목표 그래프
        ctx.beginPath();
        ctx.strokeStyle = '#e24a4aff';
        ctx.lineWidth = 3;
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
            ctx.lineTo(i, height / 2 + Math.sin(i * 0.05) * 30);
        }
        ctx.stroke();
    }, []);

    const startRecording = async () => {
        try {
            // 오디오 권한만 사용
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setCameraStream(stream);

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                // 오디오 웹엠(webm) 포맷으로 전송
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleRecordingComplete(audioBlob);

                // 마이크 끄기
                stream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("마이크 접근 실패:", err);
            alert("마이크 권한이 필요합니다.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleRecordingComplete = async (audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);

        // 1. 서버 전송 (저장 + 분석 요청)
        let taskId = null;
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");
            formData.append("curriculumId", 1);

            const submitRes = await submitPronunciation(formData);
            taskId = submitRes.taskId;
        } catch (e) {
            console.error("서버 전송 실패:", e);
        }

        // 서버 전송 실패 시 로컬 테스트 모드로 전환 여부 결정 -> 현재는 taskId 없으면 중단
        if (!taskId) {
            alert("서버 전송에 실패했습니다.");
            return;
        }

        // 2. 폴링 및 분석 데이터 수집
        let mergedResult = {
            item: item,
            userAudioUrl: audioUrl,
            nativeVideoUrl: item.nativeVideoUrl,
            grade: null,
            standardPitch: null,
            feedback: null
        };

        const pollInterval = setInterval(async () => {
            console.log(`[분석 진행 중] 폴링 수행 .. (TaskId: ${taskId})`);
            const statusRes = await checkAnalysisStatus(taskId);

            if (statusRes.result && typeof statusRes.result === 'object') {
                mergedResult = { ...mergedResult, ...statusRes.result };
            }

            // 완료 판단 (필수 데이터 3개 -> 다 받아야 완료)
            const isComplete = mergedResult.grade && mergedResult.standardPitch && mergedResult.feedback;

            if (isComplete) {
                console.log('%c[분석 완료] 모든 데이터를 수신 완료.', 'color: green; font-weight: bold;', mergedResult);
                clearInterval(pollInterval);
                navigate('/pronunciationResult', { state: mergedResult });
            }
        }, 1000);

        // 타임아웃 (일단 10초 후 강제 종료 + 더미 결과 표시)
        setTimeout(() => {
            if (mergedResult.grade) return;

            clearInterval(pollInterval);
            console.log("서버 응답 지연으로 더미 결과");

            // 더미 결과 생성
            const mockResult = getLocalMockResult(item, audioUrl);
            navigate('/pronunciationResult', { state: mockResult });
        }, 10000); // 나중에 연동 시 얼마나 걸리는지 확인 필요
    };

    const handleRecordToggle = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    return (
        <div
            className="practice-container"
        >
            <div className="practice-header">
                <h1 className="practice-title">
                    {item.word || item.symbol}
                </h1>
                <p className="practice-subtitle" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    <strong>
                        {item.ipa ? `[${item.ipa}]` : (item.pronunciation ? `[${item.pronunciation}]` : '')}
                        {item.korPronunciation ? ` ${item.korPronunciation}` : ''}
                    </strong>
                    <span style={{ color: '#888', fontWeight: 400 }}> {item.meaning ? `- ${item.meaning}` : ''}</span>
                </p>
            </div>

            {/* 시각 자료 */}
            <div className="practice-visuals">
                {/* 1. 원어민 영상 */}
                <div className="visual-box">
                    <div className="visual-label">원어민 영상</div>
                    {item.nativeVideoUrl ? (
                        <video src={item.nativeVideoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>-</div>
                    )}
                </div>

                {/* 2. 입모양 가이드 */}
                <div className="visual-box">
                    <div className="visual-label">입모양</div>
                    {item.mouthShapeUrl ? (
                        <img src={item.mouthShapeUrl} alt="입모양" style={{ width: '100%', height: '80%', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ fontSize: '3rem', opacity: 0.3 }}>-</div>
                    )}
                </div>

                {/* 3. 조음 위치 가이드 */}
                <div className="visual-box">
                    <div className="visual-label">조음 위치</div>
                    {item.tonguePositionUrl ? (
                        <img src={item.tonguePositionUrl} alt="조음 위치" style={{ width: '100%', height: '80%', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ fontSize: '3rem', opacity: 0.3 }}>-</div>
                    )}
                </div>

                {/* 4. 목표 억양 가이드 */}
                <div className="visual-box">
                    <div className="visual-label">목표 억양 그래프</div>
                    <canvas ref={canvasRef} width={400} height={150} style={{ width: '90%', height: '50%' }} />
                </div>
            </div>

            {/* 녹음 버튼 */}
            <div className="practice-controls">
                <div className="waveform-display">
                    {isRecording ? (
                        <span style={{ color: '#ff4444' }}>녹음중</span>
                    ) : (
                        <span>녹음 준비 완료!</span>
                    )}
                </div>

                <button
                    className={`record-btn-large ${isRecording ? 'recording' : ''}`}
                    onClick={handleRecordToggle}
                >
                    {isRecording ? '⏹' : ''}
                </button>
                <p style={{ marginTop: '1rem', color: '#ccc' }}>
                    {isRecording ? '버튼을 눌러 종료하세요.' : '버튼을 눌러 녹음을 시작하세요.'}
                </p>
            </div>
        </div>
    );
};

export default PronunciationPracticePage;