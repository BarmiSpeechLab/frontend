import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Square, Play } from 'lucide-react';
import './PronunciationPracticePage.css';
import { submitPronunciation, checkAnalysisStatus } from '../../api/ai';
import { convertWebMToWav } from '../../utils/audioConverter';
import { getIpaImages, getIpaImagesBySymbol } from '../../utils/ipaLoader';
import { getArticulationGifByCipa } from "../../assets/ArticulationMap";
import PronunciationAnalysisResult from "../common/PronunciationAnalysisResult";
import IntonationGraph from '../common/IntonationGraph';
import AiFeedback from '../common/AiFeedback';
import ResultCarousel from '../common/ResultCarousel';
import { getArticulationImage } from '../../utils/articulationLoader';
import { getAnswerVideo } from '../../utils/answerVideoLoader';
import runningGif from '../../assets/img/running.gif';
import ansIcon from '../../assets/img/ans.png';
import listeningIcon from '../../assets/img/listening.png';
import recordIcon from '../../assets/img/record.png';
import loadingImage from '../../assets/img/loading.png';

const PronunciationPracticePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state || {
        symbol: 'ɑ',
        word: 'car',
    };

    // Load Answer Video (Native or Local)
    const answerVideoSrc = item.nativeVideoUrl || getAnswerVideo(item.id);

    const [isRecording, setIsRecording] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // [New] 분석 대기 상태 (로딩 & 취소)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedCipa, setSelectedCipa] = useState(null);
    const [userAudioUrl, setUserAudioUrl] = useState(null);
    const pollIntervalRef = useRef(null);
    const audioRef = useRef(null);
    const answerVideoRef = useRef(null);
    const [isAnswerPlaying, setIsAnswerPlaying] = useState(false);

    const handleCancelAnalysis = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsAnalyzing(false);
    };



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
        setIsAnalyzing(true);
        setAnalysisResult(null);

        let pollCount = 0;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            pollCount++;

            if (pollCount > 40) { // 약 80초 타임아웃
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setIsAnalyzing(false);
                alert('분석 응답 시간이 초과되었습니다.');
                return;
            }

            try {
                const statusRes = await checkAnalysisStatus(item.id, taskId);

                if (statusRes.status === 'ERROR') {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsAnalyzing(false);
                    alert('분석 중 오류가 발생했습니다.');
                    return;
                }

                if (statusRes.status === 'COMPLETED' && statusRes.result) {
                    const res = statusRes.result;

                    const finalResult = {
                        item: item,
                        userAudioUrl: audioUrl,
                        nativeVideoUrl: item.nativeVideoUrl,
                        standardPitch: null
                    };

                    if (res.pronunciation) {
                        finalResult.pronunciation = res.pronunciation;
                        const analysisRows = (res.pronunciation?.analysis_result || res.pronunciation?.analysisResult) ?? [];
                        finalResult.targetWords = analysisRows.map(r => r?.target_word).filter(Boolean);
                        finalResult.ckor = analysisRows.map(r => r?.kor?.ckor).filter(Boolean);
                        finalResult.ukor = analysisRows.map(r => r?.kor?.ukor).filter(Boolean);

                        const phonemes = analysisRows.flatMap(r => r?.phonemes ?? []);
                        finalResult.phonemes = phonemes.map(p => ({
                            cipa: p?.cipa ?? "",
                            uipa: p?.uipa ?? "",
                            ok: typeof p?.is_correct === "boolean" ? p.is_correct : p?.cipa === p?.uipa,
                        }));

                        const firstWrong = finalResult.phonemes.find(p => p && p.ok === false);
                        if (firstWrong) setSelectedCipa(firstWrong.cipa);
                    }

                    if (res.intonations) {
                        finalResult.intonations = res.intonations;
                        const intonData = res.intonations.analysisResult || res.intonations.analysis_result;
                        if (Array.isArray(intonData)) {
                            let combinedUserPitch = [];
                            intonData.forEach(itm => {
                                if (itm.curve_pitch) combinedUserPitch = [...combinedUserPitch, ...itm.curve_pitch];
                            });
                            finalResult.userPitch = combinedUserPitch;
                            finalResult.userSegments = intonData;
                        }

                        const stdData = item.inton || item.intonData;
                        if (stdData && Array.isArray(stdData)) {
                            let combinedStdPitch = [];
                            stdData.forEach(p => {
                                if (p && p.curve_pitch) combinedStdPitch = [...combinedStdPitch, ...p.curve_pitch];
                            });
                            finalResult.standardPitch = combinedStdPitch;
                            finalResult.standardSegments = stdData;
                        }
                    }

                    if (res.llmFeedback) {
                        finalResult.llmFeedback = res.llmFeedback;
                        finalResult.feedback = res.llmFeedback.analysisResult || res.llmFeedback.analysis_result;
                    }

                    finalResult.taskId = taskId;
                    setAnalysisResult(finalResult);

                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsAnalyzing(false);
                    console.log('%c[분석 완료]', 'color: green; font-weight: bold;', res);
                }
            } catch (err) {
                console.error("폴링 오류:", err);
            }
        }, 2000);
    };

    const fixEncoding = (str) => {
        if (!str) return '';
        return str;
    };

    const getBestImages = () => {
        let key = item.symbol || item.ipa || (item.word && item.word.length === 1 ? item.word : null);
        if (key && typeof key === 'string') {
            key = key.replace(/[\[\]\/]/g, '').trim();
        }
        const bySymbol = getIpaImagesBySymbol(key);
        if (bySymbol.mouth || bySymbol.tongue) return bySymbol;
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
        } else {
            navigate(-1);
        }
    };

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    return (
        <div className="practice-container-merged">
            {/* 헤더 */}
            <div className="practice-header">
                <div className="header-top">
                    <button className="back-button" onClick={handleBack}>뒤로 가기</button>
                </div>
                <div className="top-section-card">
                    <div className="header-text">
                        <h1 className="practice-title">{fixEncoding(item.word || item.symbol)}</h1>
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
                    <div className="visual-col">
                        <div className="visual-label-outside">정답 입모양</div>
                        <div className="header-video" style={{ background: '#fff', position: 'relative' }}>
                            {answerVideoSrc ? (
                                <>
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        {!isAnswerPlaying && (
                                            <p className="status-text" style={{
                                                position: 'absolute',
                                                top: '30px',
                                                left: 0,
                                                width: '100%',
                                                textAlign: 'center',
                                                fontSize: '1rem',
                                                color: '#9f9f9f',
                                                zIndex: 20
                                            }}>
                                                바르미를 눌러 영상을 확인하세요!
                                            </p>
                                        )}
                                        <video
                                            ref={answerVideoRef}
                                            src={answerVideoSrc}
                                            controls
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: isAnswerPlaying ? 'block' : 'none' }}
                                            onEnded={() => setIsAnswerPlaying(false)}
                                            onPause={() => setIsAnswerPlaying(false)}
                                            onPlay={() => setIsAnswerPlaying(true)}
                                        />
                                        {!isAnswerPlaying && (
                                            <div
                                                className="video-overlay-white"
                                                onClick={() => {
                                                    if (answerVideoRef.current) {
                                                        answerVideoRef.current.play();
                                                        setIsAnswerPlaying(true);
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                    background: 'rgba(255, 255, 255, 0.3)', // 투명도 조절 (0.7 -> 0.3)
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                                                }}
                                            >
                                                <img
                                                    src={ansIcon}
                                                    alt="재생"
                                                    style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <img src={loadingImage} alt="준비 중" style={{ width: '90%', height: '90%', objectFit: 'contain', opacity: 0.8 }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="merged-layout">
                {/* Row 1: 결과 및 녹음 제어 */}
                <div className="row-2-myrecording">
                    <div className="record-section">
                        <div className="visual-label-outside">녹음하기</div>
                        {!analysisResult && (
                            <div className="record-panel-glass">
                                {/* .record-title removed */}
                                <div className="record-controls">
                                    <p className="status-text" style={{ marginBottom: '0.5rem' }}>바르미를 눌러 녹음해보세요!</p>
                                    <button
                                        className={`record-btn-merged ${isRecording ? "recording" : ""}`}
                                        onClick={handleRecordToggle}
                                        disabled={isAnalyzing}
                                    >
                                        <img
                                            src={isRecording ? listeningIcon : recordIcon}
                                            alt={isRecording ? "녹음 중" : "녹음 하기"}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </button>
                                    <div className="record-status">
                                        <p className="status-text">{isRecording ? "녹음 중 ..." : "준비 완료!"}</p>
                                        {userAudioUrl && (
                                            <button className="play-btn" onClick={handlePlayAudio} disabled={isAnalyzing}>
                                                <Play size={20} /> 다시 듣기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {analysisResult && (
                            <PronunciationAnalysisResult
                                targetWords={analysisResult.targetWords}
                                phonemes={analysisResult.phonemes}
                                ckor={analysisResult.ckor}
                                ukor={analysisResult.ukor}
                                selectedCipa={selectedCipa}
                                onSelectCipa={setSelectedCipa}
                                onRedo={() => { setAnalysisResult(null); setSelectedCipa(null); }}
                            />
                        )}
                    </div>

                    <div className="visual-col">
                        <div className="visual-label-outside">조음 위치</div>
                        <div className={`visual-card visual-card-compact ${analysisResult ? "articulation--done" : "articulation--idle"}`}>
                            {(() => {
                                const wrongGif = selectedCipa ? getArticulationGifByCipa(selectedCipa) : null;
                                // New Loader Logic
                                const newImage = getArticulationImage(item.id, item.symbol);
                                const imageSrc = wrongGif || newImage || localTongue || item.tonguePositionUrl;

                                return imageSrc ? (
                                    <img src={imageSrc} alt="조음 위치" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <img src={loadingImage} alt="준비 중" style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: 0.8 }} />
                                );
                            })()}
                        </div>
                    </div>

                    {!isAnalyzing && analysisResult && (
                        <button className="redo-btn-absolute" onClick={() => { setAnalysisResult(null); setSelectedCipa(null); }}>
                            다시 시도
                        </button>
                    )}
                </div>

                <div className="analysis-grid">
                    <div className="row-3-intonation">
                        <IntonationGraph
                            standardPitch={analysisResult?.standardPitch || []}
                            userPitch={analysisResult?.userPitch || []}
                            standardSegments={analysisResult?.standardSegments || []}
                            userSegments={analysisResult?.userSegments || []}
                            width={800} height={450}
                        />
                    </div>

                    <div className="row-4-feedback">
                        <AiFeedback feedback={analysisResult?.feedback || null} />
                    </div>
                </div>
            </div>

            {isAnalyzing && createPortal(
                <div className="analysis-overlay">
                    <div className="analysis-spinner-box">
                        <img src={runningGif} alt="Analyzing..." className="analysis-gif" />
                        <p className="analysis-text">발음 분석 중 ...</p>
                        <button className="analysis-cancel-btn" onClick={handleCancelAnalysis}>
                            취소
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* 숨겨진 오디오 엘리먼트 */}
            <audio ref={audioRef} />
        </div>
    );
};

export default PronunciationPracticePage;
