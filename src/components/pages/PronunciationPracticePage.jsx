import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Square } from 'lucide-react';
import './PronunciationPracticePage.css';
import { submitPronunciation, checkAnalysisStatus } from '../../api/ai';
import { convertWebMToWav } from '../../utils/audioConverter';
import { getIpaImages } from '../../utils/ipaLoader';

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

            mediaRecorderRef.current.onstop = async () => {
                // 오디오 웹엠(webm) 포맷으로 전송
                const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // [수정] WebM -> WAV 변환 (백엔드 호환성)
                try {
                    const wavBlob = await convertWebMToWav(webmBlob);
                    handleRecordingComplete(wavBlob);
                } catch (e) {
                    console.error("오디오 변환 실패:", e);
                    alert("오디오 변환 중 오류가 발생했습니다.");
                }

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
        console.log('[Audio Blob]', audioBlob.type, audioBlob.size);

        const audioUrl = URL.createObjectURL(audioBlob);

        // 1. 서버 전송 (저장 + 분석 요청)
        let taskId = null;
        try {
            // submitPronunciation이 { taskId } 객체를 반환
            const response = await submitPronunciation(audioBlob, item.id);
            taskId = response.taskId;  // ✅ 객체에서 taskId 추출
            console.log('[제출 성공] Task ID:', taskId);
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

        let hasNavigated = false;  // 중복 네비게이션 방지

        const pollInterval = setInterval(async () => {
            if (hasNavigated) {
                clearInterval(pollInterval);
                return;
            }
            console.log(`[분석 진행 중] 폴링 수행 .. (TaskId: ${taskId})`);
            const statusRes = await checkAnalysisStatus(item.id, taskId);

            console.log('[폴링 응답]', {
                status: statusRes.status,
                hasResult: !!statusRes.result,
                result: statusRes.result
            });

            // ERROR 상태: 폴링 중단
            if (statusRes.status === 'ERROR') {
                console.error('[분석 에러] 서버에서 에러 반환');
                clearInterval(pollInterval);
                alert('분석 중 오류가 발생했습니다.');
                return;
            }

            if ((statusRes.status === 'COMPLETED' || statusRes.status === 'PROCESSING') && statusRes.result) {
                const res = statusRes.result;

                console.log('[결과 상세]', {
                    pronunciation: res.pronunciation,
                    intonations: res.intonations,
                    llmFeedback: res.llmFeedback
                });

                // 백엔드 응답에서 새 데이터를 받으면 mergedResult에 누적 저장
                if (res.pronunciation && !mergedResult.pronunciation) {
                    console.log('[PRON 저장] 발음 데이터 수신');
                    mergedResult.pronunciation = res.pronunciation;

                    const pron = res.pronunciation;
                    mergedResult.grade = pron.grade || pron.score;
                    mergedResult.feedback = pron.feedback || mergedResult.feedback;
                    mergedResult.standardPitch = pron.standardPitch || mergedResult.standardPitch;
                    mergedResult.userPitch = pron.userPitch || mergedResult.userPitch;
                    mergedResult.wordSegments = pron.wordSegments;
                }

                if (res.intonations && !mergedResult.intonations) {
                    console.log('[INTON 저장] 억양 데이터 수신');
                    mergedResult.intonations = res.intonations;

                    const inton = res.intonations;
                    mergedResult.standardPitch = mergedResult.standardPitch || inton.standardPitch;
                    mergedResult.userPitch = mergedResult.userPitch || inton.userPitch;
                }

                if (res.llmFeedback && !mergedResult.llmFeedback) {
                    console.log('[LLM 저장] 피드백 데이터 수신');
                    mergedResult.llmFeedback = res.llmFeedback;

                    const llm = res.llmFeedback;
                    mergedResult.feedback = mergedResult.feedback || llm.feedback;
                }

                mergedResult.taskId = taskId;
                mergedResult.rawResult = res;

                // mergedResult 기준으로 완료 판단
                const isAllArrived = mergedResult.pronunciation && mergedResult.intonations && mergedResult.llmFeedback;

                console.log('[완료 체크]', {
                    hasPron: !!mergedResult.pronunciation,
                    hasInton: !!mergedResult.intonations,
                    hasLLM: !!mergedResult.llmFeedback,
                    isAllArrived
                });

                if (isAllArrived && !hasNavigated) {
                    console.log('%c[분석 완료] 모든 데이터를 수신 완료.', 'color: green; font-weight: bold;', mergedResult);
                    hasNavigated = true;
                    clearInterval(pollInterval);
                    navigate('/pronunciationResult', { state: mergedResult });
                } else if (!isAllArrived) {
                    console.warn('[대기 중] 누적 데이터:', {
                        pron: !!mergedResult.pronunciation,
                        inton: !!mergedResult.intonations,
                        llm: !!mergedResult.llmFeedback
                    });
                }
            }
        }, 1000);

        // 타임아웃 (30초 후 자동 종료)
        setTimeout(() => {
            clearInterval(pollInterval);
            console.warn('[타임아웃] 분석 응답 시간 초과');
            alert('분석 시간이 초과되었습니다. 다시 시도해주세요.');
        }, 3000000);
    };

    const handleRecordToggle = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    // Windows-1252(Latin-1 Sup)로 잘못 해석된 UTF-8 복구 (PracticePage용 안전장치) 
    const fixEncoding = (str) => {
        return str;
    };

    // [New] 로컬 에셋 매핑 (ID 기반)
    // DB의 item.id와 폴더명의 숫자(예: 1_ɑ)가 일치한다고 가정
    const { mouth: localMouth, tongue: localTongue } = getIpaImages(item.id);

    return (
        <div className="practice-container">
            <div className="practice-header">
                <h1 className="practice-title">
                    {fixEncoding(item.word || item.symbol)}
                </h1>
                <p className="practice-subtitle" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    <strong>
                        {item.ipa ? `[${fixEncoding(item.ipa)}]` : (item.pronunciation ? `[${fixEncoding(item.pronunciation)}]` : '')}
                        {item.korPronunciation ? ` ${fixEncoding(item.korPronunciation)}` : ''}
                    </strong>
                    <span style={{ color: '#888', fontWeight: 400 }}> {item.meaning ? `- ${fixEncoding(item.meaning)}` : ''}</span>
                </p>

                {/* IPA 예시 단어 표시 (IPA 타입일 때만 노출) */}
                {
                    item.type === 'ipa' && item.examples && item.examples.length > 0 && (
                        <div style={{ marginTop: '1rem', background: '#f5f5f5', padding: '0.8rem', borderRadius: '8px', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {item.examples.map((ex, idx) => (
                                <div key={idx} style={{ fontSize: '1rem', color: '#555' }}>
                                    <span style={{ fontWeight: 'bold', color: '#a67c00' }}>{fixEncoding(ex.ex_text)}</span>
                                    <span style={{ marginLeft: '6px', color: '#777' }}>{fixEncoding(ex.ex_mean)}</span>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>

            {/* 시각 자료 */}
            <div className="practice-visuals">
                {/* 1. 원어민 영상 */}
                <div className="visual-box">
                    <div className="visual-label">원어민 영상</div>
                    {
                        item.nativeVideoUrl ? (
                            <video src={item.nativeVideoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>-</div>
                        )
                    }
                </div>

                {/* 2. 입모양 가이드 */}
                <div className="visual-box">
                    <div className="visual-label">입모양</div>
                    {
                        item.mouthShapeUrl ? (
                            <img src={item.mouthShapeUrl} alt="입모양" style={{ width: '100%', height: '80%', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ fontSize: '3rem', opacity: 0.3 }}>-</div>
                        )
                    }
                </div>

                {/* 3. 조음 위치 가이드 (로컬 이미지 우선) */}
                <div className="visual-box">
                    <div className="visual-label">조음 위치</div>
                    {
                        (localTongue || item.tonguePositionUrl) ? (
                            <img src={localTongue || item.tonguePositionUrl} alt="조음 위치" style={{ width: '100%', height: '80%', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ fontSize: '3rem', opacity: 0.3 }}>-</div>
                        )
                    }
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
                    {isRecording ? <Square size={32} /> : <Mic size={32} />}
                </button>
                <p style={{ marginTop: '1rem', color: '#ccc' }}>
                    {isRecording ? '버튼을 눌러 종료하세요.' : '버튼을 눌러 녹음을 시작하세요.'}
                </p>
            </div>
        </div>
    );
};

export default PronunciationPracticePage;