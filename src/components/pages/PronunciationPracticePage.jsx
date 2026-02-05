import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Square } from 'lucide-react';
import './PronunciationPracticePage.css';
import { submitPronunciation, checkAnalysisStatus } from '../../api/ai';
import { convertWebMToWav } from '../../utils/audioConverter';
import { getIpaImages, getIpaImagesBySymbol } from '../../utils/ipaLoader';

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

    // [New] 분석 대기 상태 (로딩 & 취소)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const pollIntervalRef = useRef(null);

    const handleCancelAnalysis = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsAnalyzing(false);
    };

    // 목표 억양 시각화
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // 목표 그래프 (실제 데이터 사용)
        const stdData = item.inton || item.intonData;
        let pitchData = [];

        // 데이터 파싱
        if (Array.isArray(stdData)) {
            stdData.forEach(p => {
                if (p && Array.isArray(p.curve_pitch)) {
                    pitchData = [...pitchData, ...p.curve_pitch];
                }
            });
        }

        if (pitchData.length > 0) {
            // 정규화 (최솟값 0 처리)
            const minVal = Math.min(...pitchData.filter(v => v > 0));
            const maxVal = Math.max(...pitchData);
            const range = maxVal - minVal || 1;

            ctx.beginPath();
            ctx.strokeStyle = '#e24a4aff';
            ctx.lineWidth = 3;
            // 둥근 선 처리
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const stepX = width / (pitchData.length - 1 || 1);

            pitchData.forEach((val, idx) => {
                const x = idx * stepX;
                // 무음(0이하)이면 바닥에, 아니면 값에 비례해서 위로
                const y = val <= 0 ? height : height - ((val - minVal) / range) * (height * 0.8) - (height * 0.1);

                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        } else {
            // 데이터가 없을 경우 안내 텍스트 표시
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';
            ctx.fillText('표준 억양 데이터가 없습니다.', width / 2, height / 2);
        }
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

                // [수정] WebM -> WAV 변환
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
        setIsAnalyzing(true); // 분석 시작 상태

        let mergedResult = {
            item: item,
            userAudioUrl: audioUrl,
            nativeVideoUrl: item.nativeVideoUrl,
            grade: null,
            standardPitch: null,
            feedback: null
        };

        let hasNavigated = false;  // 중복 네비게이션 방지

        // 기존 인터벌 제거 (안전장치)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            if (hasNavigated) {
                clearInterval(pollIntervalRef.current);
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
                clearInterval(pollIntervalRef.current);
                setIsAnalyzing(false); // 분석 종료
                alert('분석 중 오류가 발생했습니다.');
                return;
            }

            if ((statusRes.status === 'COMPLETED' || statusRes.status === 'PROCESSING') && statusRes.result) {
                const res = statusRes.result;

                // 백엔드 응답에서 새 데이터를 받으면 mergedResult에 누적 저장
                if (res.pronunciation && !mergedResult.pronunciation) {
                    mergedResult.pronunciation = res.pronunciation;
                    const pronRaw = res.pronunciation;

                    // [Fix] analysisResult is an Array of word objects
                    const pronData = pronRaw.analysisResult;
                    if (Array.isArray(pronData)) {
                        mergedResult.wordSegments = pronData;

                        // Calculate average grade
                        const totalScore = pronData.reduce((acc, cur) => acc + (cur.score || (100 - (cur.error_rate || 0)) || 0), 0);
                        const avgScore = pronData.length > 0 ? totalScore / pronData.length : 0;
                        mergedResult.grade = avgScore >= 80 ? 'EXCELLENT' : (avgScore >= 50 ? 'GOOD' : 'BAD');
                    }
                }

                if (res.intonations && !mergedResult.intonations) {
                    mergedResult.intonations = res.intonations;
                    const intonRaw = res.intonations;
                    const intonData = intonRaw.analysisResult; // Array of items

                    // [Fix] Aggregate curve_pitch for userPitch
                    if (Array.isArray(intonData)) {
                        let combinedUserPitch = [];
                        intonData.forEach(item => {
                            if (item.curve_pitch && Array.isArray(item.curve_pitch)) {
                                combinedUserPitch = [...combinedUserPitch, ...item.curve_pitch];
                            }
                        });
                        mergedResult.userPitch = combinedUserPitch;

                        mergedResult.userPitch = combinedUserPitch;

                        // [Fix] Load standard pitch from item.intonData (DB) or item.inton (DTO)
                        const stdData = item.inton || item.intonData;
                        if (stdData && Array.isArray(stdData)) {
                            let combinedStdPitch = [];
                            stdData.forEach(p => {
                                if (p && p.curve_pitch) { // DB uses snake_case keys
                                    combinedStdPitch = [...combinedStdPitch, ...p.curve_pitch];
                                }
                            });
                            mergedResult.standardPitch = combinedStdPitch;
                        } else {
                            mergedResult.standardPitch = [];
                        }
                    }
                }

                if (res.llmFeedback && !mergedResult.llmFeedback) {
                    mergedResult.llmFeedback = res.llmFeedback;
                    const llm = res.llmFeedback;
                    // Fix: llmFeedback returns 'analysisResult', not 'feedback'
                    mergedResult.feedback = llm.analysisResult || mergedResult.feedback;
                }

                mergedResult.taskId = taskId;
                mergedResult.rawResult = res;

                // mergedResult 기준으로 완료 판단
                // [Fix] intonations might be missing standardPitch in AnalysisResult, but we use DB data
                const isAllArrived = mergedResult.pronunciation && mergedResult.intonations && mergedResult.llmFeedback;

                if (isAllArrived && !hasNavigated) {
                    // Ensure standardPitch is populated if it wasn't already (double check)
                    // [Fix] Backend DTO field is 'inton', Entity is 'intonData'. Check both.
                    const stdData = item.inton || item.intonData;
                    if ((!mergedResult.standardPitch || mergedResult.standardPitch.length === 0) && stdData) {
                        let combinedStdPitch = [];
                        if (Array.isArray(stdData)) {
                            stdData.forEach(p => {
                                if (p && p.curve_pitch) {
                                    combinedStdPitch = [...combinedStdPitch, ...p.curve_pitch];
                                }
                            });
                        }
                        mergedResult.standardPitch = combinedStdPitch;
                    }

                    console.log('%c[분석 완료] 모든 데이터를 수신 완료.', 'color: green; font-weight: bold;', mergedResult);
                    hasNavigated = true;
                    // [Fix] 성공 시 Ref를 null로 초기화하여 타임아웃 방지
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsAnalyzing(false); // 분석 완료
                    navigate('/pronunciationResult', { state: mergedResult });
                }
            }
        }, 1000);

        // 타임아웃 (30초 후 자동 종료)
        setTimeout(() => {
            // [Fix] 이미 완료되어 pollIntervalRef가 null이거나 네비게이션 된 경우 무시
            if (pollIntervalRef.current && !hasNavigated) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setIsAnalyzing(false);
                console.warn('[타임아웃] 분석 응답 시간 초과');
                alert('분석 시간이 초과되었습니다. 다시 시도해주세요.');
            }
        }, 30000); // 30초로 수정
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

    // [New] 로컬 에셋 매핑 (Symbol -> ID 순서로 검색)
    // 1. Symbol 기반 검색 (가장 정확함)
    // 2. ID 기반 검색 (Legacy)
    const getBestImages = () => {
        // 검색 키: symbol 우선 -> ipa -> word(한 글자인 경우)
        let key = item.symbol || item.ipa || (item.word && item.word.length === 1 ? item.word : null);

        // 대괄호/슬래시 제거 ([a] -> a, /a/ -> a)
        if (key && typeof key === 'string') {
            key = key.replace(/[\[\]\/]/g, '').trim();
        }

        const bySymbol = getIpaImagesBySymbol(key);
        if (bySymbol.mouth || bySymbol.tongue) {
            return bySymbol;
        }

        // ID 기반 Fallback
        return getIpaImages(item.id);
    };

    const { mouth: localMouth, tongue: localTongue } = getBestImages();

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
            {/* Loading Overlay */}
            {isAnalyzing && (
                <div className="analysis-overlay">
                    <div className="analysis-spinner-box">
                        <div className="spinner-circle"></div>
                        <p className="analysis-text">발음을 분석 중입니다...</p>
                        <button className="analysis-cancel-btn" onClick={handleCancelAnalysis}>
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PronunciationPracticePage;