import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Square, Play } from 'lucide-react';
import './PronunciationPracticePage.css';
import { submitPronunciation, checkAnalysisStatus } from '../../api/ai';
import { convertWebMToWav } from '../../utils/audioConverter';
import { getIpaImages, getIpaImagesBySymbol } from '../../utils/ipaLoader';
import { getArticulationGifByCipa } from "../../assets/ArticulationMap";
import PronunciationAnalysisResult from "../common/PronunciationAnalysisResult";

const PronunciationPracticePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state || {
        symbol: 'ɑ',
        word: 'car',
    };

    const [isRecording, setIsRecording] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const canvasRef = useRef(null);
    const graphCanvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // [New] 분석 대기 상태 (로딩 & 취소)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedCipa, setSelectedCipa] = useState(null);
    const [userAudioUrl, setUserAudioUrl] = useState(null);
    const pollIntervalRef = useRef(null);
    const audioRef = useRef(null);

    const handleCancelAnalysis = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsAnalyzing(false);
    };

    // 억양 그래프 그리기
    useEffect(() => {
        const drawGraph = (canvas, standardPitch, userPitch) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            const stdPitch = standardPitch || [];
            const usrPitch = userPitch || [];

            if (stdPitch.length === 0 && usrPitch.length === 0) return;

            // Y축 정규화
            const allValues = [...stdPitch, ...usrPitch].filter(v => v > 0);
            if (allValues.length === 0) return;

            const minVal = Math.min(...allValues) * 0.9;
            const maxVal = Math.max(...allValues) * 1.1;
            const range = maxVal - minVal || 1;

            const getY = (val) => {
                if (val <= 0) return height;
                return height - ((val - minVal) / range) * height;
            };

            const drawLine = (data, color) => {
                if (!data || data.length === 0) return;

                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const stepX = width / (data.length - 1 || 1);

                data.forEach((val, idx) => {
                    const x = idx * stepX;
                    const y = getY(val);

                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            };

            drawLine(stdPitch, '#e24a4aff');
            drawLine(usrPitch, '#00ff22ff');
        };

        // 초기 로드: 목표 억양만 그리기
        if (!analysisResult) {
            const stdData = item.inton || item.intonData;
            let pitchData = [];
            if (Array.isArray(stdData)) {
                stdData.forEach(p => {
                    if (p && Array.isArray(p.curve_pitch)) {
                        pitchData = [...pitchData, ...p.curve_pitch];
                    }
                });
            }
            if (pitchData.length > 0) {
                drawGraph(graphCanvasRef.current, pitchData, []);
            }
        } else {
            // 분석 결과 있을 때: 표준 + 사용자 억양 그리기
            drawGraph(graphCanvasRef.current, analysisResult.standardPitch, analysisResult.userPitch || []);
        }
    }, [analysisResult, item]);

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

    const handleRecordToggle = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    const handleRecordingComplete = async (audioBlob) => {
        console.log('[Audio Blob]', audioBlob.type, audioBlob.size);

        const audioUrl = URL.createObjectURL(audioBlob);
        setUserAudioUrl(audioUrl);

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
            standardPitch: null
        };

        let hasUpdated = false;
        let pollCount = 0;

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            pollCount++;

            if (pollCount > 5) {
                // Exponential backoff: 2초 간격으로 계속 폴링
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = setInterval(async () => {
                    console.log(`[분석 진행 중] 폴링 수행 ${pollCount}회 (TaskId: ${taskId})`);
                    const statusRes = await checkAnalysisStatus(item.id, taskId);

                    if (statusRes.status === 'ERROR') {
                        clearInterval(pollIntervalRef.current);
                        setIsAnalyzing(false);
                        alert('분석 중 오류가 발생했습니다.');
                        return;
                    }

                    if ((statusRes.status === 'COMPLETED' || statusRes.status === 'PROCESSING') && statusRes.result) {
                        const res = statusRes.result;

                        if (res.pronunciation && !mergedResult.pronunciation) {
                            mergedResult.pronunciation = res.pronunciation;
                            const pronData = res.pronunciation.analysisResult;
                            if (Array.isArray(pronData)) {
                                mergedResult.wordSegments = pronData;
                                const totalScore = pronData.reduce((acc, cur) => acc + (cur.score || (100 - (cur.error_rate || 0)) || 0), 0);
                                const avgScore = pronData.length > 0 ? totalScore / pronData.length : 0;
                                mergedResult.grade = avgScore >= 80 ? 'EXCELLENT' : (avgScore >= 50 ? 'GOOD' : 'BAD');
                            }
                        }

                        if (res.intonations && !mergedResult.intonations) {
                            mergedResult.intonations = res.intonations;
                            const intonData = res.intonations.analysisResult;
                            if (Array.isArray(intonData)) {
                                let combinedUserPitch = [];
                                intonData.forEach(itm => {
                                    if (itm.curve_pitch && Array.isArray(itm.curve_pitch)) {
                                        combinedUserPitch = [...combinedUserPitch, ...itm.curve_pitch];
                                    }
                                });
                                mergedResult.userPitch = combinedUserPitch;

                                const stdData = item.inton || item.intonData;
                                if (stdData && Array.isArray(stdData)) {
                                    let combinedStdPitch = [];
                                    stdData.forEach(p => {
                                        if (p && p.curve_pitch) {
                                            combinedStdPitch = [...combinedStdPitch, ...p.curve_pitch];
                                        }
                                    });
                                    mergedResult.standardPitch = combinedStdPitch;
                                }
                            }
                        }

                        if (res.llmFeedback && !mergedResult.llmFeedback) {
                            mergedResult.llmFeedback = res.llmFeedback;
                            const llm = res.llmFeedback;
                            mergedResult.feedback = llm.analysisResult || mergedResult.feedback;
                        }

                        if (!hasUpdated && (mergedResult.pronunciation || mergedResult.intonations || mergedResult.llmFeedback)) {
                            hasUpdated = true;
                            setAnalysisResult(mergedResult);
                        }

                        const isAllArrived = mergedResult.pronunciation && mergedResult.intonations && mergedResult.llmFeedback;
                        if (isAllArrived) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                            setIsAnalyzing(false);
                        }
                    }
                }, 2000);
                return;
            }

            console.log(`[분석 진행 중] 폴링 수행 ${pollCount}회 (TaskId: ${taskId})`);
            const statusRes = await checkAnalysisStatus(item.id, taskId);

            if (statusRes.status === 'ERROR') {
                console.error('[분석 에러] 서버에서 에러 반환');
                clearInterval(pollIntervalRef.current);
                setIsAnalyzing(false);
                alert('분석 중 오류가 발생했습니다.');
                return;
            }

            if ((statusRes.status === 'COMPLETED' || statusRes.status === 'PROCESSING') && statusRes.result) {
                const res = statusRes.result;

                if (res.pronunciation && !mergedResult.pronunciation) {
                    mergedResult.pronunciation = res.pronunciation;
                    const pronData = res.pronunciation.analysisResult;
                    if (Array.isArray(pronData)) {
                        mergedResult.wordSegments = pronData;
                        const totalScore = pronData.reduce((acc, cur) => acc + (cur.score || (100 - (cur.error_rate || 0)) || 0), 0);
                        const avgScore = pronData.length > 0 ? totalScore / pronData.length : 0;
                        mergedResult.grade = avgScore >= 80 ? 'EXCELLENT' : (avgScore >= 50 ? 'GOOD' : 'BAD');
                    }
                }

                if (res.intonations && !mergedResult.intonations) {
                    mergedResult.intonations = res.intonations;
                    const intonData = res.intonations.analysisResult;
                    if (Array.isArray(intonData)) {
                        let combinedUserPitch = [];
                        intonData.forEach(itm => {
                            if (itm.curve_pitch && Array.isArray(itm.curve_pitch)) {
                                combinedUserPitch = [...combinedUserPitch, ...itm.curve_pitch];
                            }
                        });
                        mergedResult.userPitch = combinedUserPitch;

                        const stdData = item.inton || item.intonData;
                        if (stdData && Array.isArray(stdData)) {
                            let combinedStdPitch = [];
                            stdData.forEach(p => {
                                if (p && p.curve_pitch) {
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
                    mergedResult.feedback = llm.analysisResult || mergedResult.feedback;
                }

                mergedResult.taskId = taskId;
                mergedResult.rawResult = res;

                // 결과 업데이트 (화면에 표시)
                if (!hasUpdated && (mergedResult.pronunciation || mergedResult.intonations || mergedResult.llmFeedback)) {
                    hasUpdated = true;
                    setAnalysisResult(mergedResult);
                }

                const isAllArrived = mergedResult.pronunciation && mergedResult.intonations && mergedResult.llmFeedback;

                if (isAllArrived) {
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
                        setAnalysisResult(mergedResult);
                    }

                    console.log('%c[분석 완료]', 'color: green; font-weight: bold;', mergedResult);
                    
                    const phonemes =
                        mergedResult?.pronunciation?.analysis_result
                        ?.flatMap((r) => r?.phonemes ?? []) ?? [];

                    const phonemeRows = phonemes.map((p) => ({
                        cipa: p?.cipa ?? "",
                        uipa: p?.uipa ?? "",
                        ok: typeof p?.is_correct === "boolean" ? p.is_correct : p?.cipa === p?.uipa,
                    }));
                    
                    const analysisRows =
                        mergedResult?.pronunciation?.analysis_result ??
                        mergedResult?.pronunciation?.analysisResult ??
                        [];
                        
                    const targetWords  =
                        analysisRows.map((r) => r?.target_word).filter(Boolean);
                    
                    setAnalysisResult({
                        ...mergedResult, // 기존 mergedResult 데이터 유지
                        targetWords,
                        phonemes: phonemeRows,

                        ckor: 
                            mergedResult?.pronunciation?.analysis_result
                            ?.map(r => r?.kor?.ckor)
                            .filter(Boolean) ?? [],

                        ukor: 
                            mergedResult?.pronunciation?.analysis_result
                            ?.map(r => r?.kor?.ukor)
                            .filter(Boolean) ?? [],
                    });

                    // 첫 번째 오답을 자동 선택
                    const firstWrong = phonemeRows.find((p) => p && p.ok === false);
                    setSelectedCipa(firstWrong ? firstWrong.cipa : null);

                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsAnalyzing(false);
                }
            }
        }, 1000);

        setTimeout(() => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setIsAnalyzing(false);
                console.warn('[타임아웃] 분석 응답 시간 초과');
                alert('분석 시간이 초과되었습니다. 다시 시도해주세요.');
            }
        }, 30000);
    };

    const fixEncoding = (str) => {
        return str;
    };

    const getBestImages = () => {
        let key = item.symbol || item.ipa || (item.word && item.word.length === 1 ? item.word : null);
        if (key && typeof key === 'string') {
            key = key.replace(/[\[\]\/]/g, '').trim();
        }
        const bySymbol = getIpaImagesBySymbol(key);
        if (bySymbol.mouth || bySymbol.tongue) {
            return bySymbol;
        }
        return getIpaImages(item.id);
    };

    const { mouth: localMouth, tongue: localTongue } = getBestImages();

    const handlePlayAudio = () => {
        if (userAudioUrl && audioRef.current) {
            audioRef.current.src = userAudioUrl;
            audioRef.current.play();
        }
    };

    const handleBack = () => {
        if (item.returnPath) {
            navigate(item.returnPath);
            return;
        }
        navigate(-1);
    };

    return (
        <div className="practice-container-merged">
            {/* 헤더 */}
            <div className="practice-header">
                <div className="header-top">
                    <button className="back-button" onClick={handleBack}>
                        뒤로가기
                    </button>
                </div>
                <div className="header-row">
                    <div className="header-text">
                        <h1 className="practice-title">
                            {fixEncoding(item.word || item.symbol)}
                        </h1>
                        <div className="practice-subtitle">
                            <div className="subtitle-row">
                                <span className="subtitle-ipa">
                                    {item.ipa ? `[${fixEncoding(item.ipa)}]` : (item.pronunciation ? `[${fixEncoding(item.pronunciation)}]` : '')}
                                </span>
                                {item.korPronunciation && (
                                    <span className="subtitle-kor">{fixEncoding(item.korPronunciation)}</span>
                                )}
                            </div>
                            {item.meaning && (
                                <div className="subtitle-meaning">{fixEncoding(item.meaning)}</div>
                            )}
                        </div>
                        {((item.examples && item.examples.length > 0) || (item.text && item.text.examples && item.text.examples.length > 0)) && (
                            <div className="examples-panel">
                                {(item.examples || item.text.examples).map((ex, idx) => (
                                    <div key={idx} className="example-chip">
                                        <span className="example-text">{fixEncoding(ex.ex_text)}</span>
                                        <span className="example-meaning">{fixEncoding(ex.ex_mean)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="header-video">
                        <div className="visual-label">원어민 발음</div>
                        {item.nativeVideoUrl ? (
                            <video src={item.nativeVideoUrl} controls />
                        ) : (
                            <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>-</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4행 레이아웃 */}
            <div className="merged-layout">
                {/* Row 1: 내 발음 + 조음 위치 */}
                <div className="row-2-myrecording">
                    <div className="record-section">
                    <div className="record-title">
                        {!isAnalyzing && analysisResult ? "분석 결과" : "내 발음 녹음"}
                    </div>

                    {/* 분석 완료 후: 결과 표시 */}
                    {!isAnalyzing && analysisResult && (
                        <PronunciationAnalysisResult
                            targetWords={analysisResult.targetWords}   
                            phonemes={analysisResult.phonemes}
                            ckor={analysisResult.ckor}
                            ukor={analysisResult.ukor}
                            selectedCipa={selectedCipa}
                            onSelectCipa={setSelectedCipa}
                            onRedo={() => {
                                setAnalysisResult(null);
                                setSelectedCipa(null);
                            }}
                        />
                    )}

                    {/* 분석 완료 전: 기존 UI 그대로 */}
                    {!analysisResult && (
                        <div className="record-controls">
                        <button
                            className={`record-btn-merged ${isRecording ? "recording" : ""}`}
                            onClick={handleRecordToggle}
                            disabled={isAnalyzing}
                        >
                            {isRecording ? <Square size={40} /> : <Mic size={40} />}
                        </button>

                        <div className="record-status">
                            <p className="status-text">{isRecording ? "🔴 녹음 중..." : "준비 완료"}</p>

                            {userAudioUrl && (
                            <button className="play-btn" onClick={handlePlayAudio} disabled={isAnalyzing}>
                                <Play size={20} /> 다시 듣기
                            </button>
                            )}
                        </div>
                        </div>
                    )}
                    </div>
                   
                    <div 
                        className={`visual-card visual-card-compact ${analysisResult ? "articulation--done" : "articulation--idle"}`}
                    >
                        <div className="visual-label">조음 위치</div>
                        {(() => {
                            // selectedCipa가 있으면 그에 해당하는 GIF 우선 표시
                            const wrongGif = selectedCipa ? getArticulationGifByCipa(selectedCipa) : null;
                            const imageSrc = wrongGif || localTongue || item.tonguePositionUrl;
                            
                            return imageSrc ? (
                                <img 
                                    src={imageSrc} 
                                    alt="조음 위치" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                />
                            ) : (
                                <div style={{ fontSize: '3rem', opacity: 0.3 }}>-</div>
                            );
                        })()}
                    </div>
                </div>

                <div className="analysis-grid">
                    {/* Row 3: 억양 그래프 */}
                    <div className="row-3-intonation">
                        <div className="graph-card">
                            <div className="graph-title">
                                <span>억양 분석</span>
                                <div style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                                    <span style={{ color: '#e24a4aff', marginRight: '10px' }}>· 표준</span>
                                    <span style={{ color: '#00ff22ff' }}>· 내 발음</span>
                                </div>
                            </div>
                            <canvas ref={graphCanvasRef} width={800} height={150} style={{ width: '100%', height: 'auto' }} />
                        </div>
                    </div>

                    {/* Row 4: AI 피드백 */}
                    <div className="row-4-feedback">
                        <div className="feedback-card">
                            <div className="feedback-title">AI 피드백</div>
                            <div className="feedback-content">
                                {analysisResult && analysisResult.feedback ? (
                                    <p>{analysisResult.feedback}</p>
                                ) : (
                                    <p style={{ color: '#999', fontStyle: 'italic' }}>발음 분석 중...피드백을 기다리는 중입니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 분석 중 오버레이 */}
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

            {/* 숨겨진 오디오 엘리먼트 */}
            <audio ref={audioRef} />
        </div>
    );
};

export default PronunciationPracticePage;