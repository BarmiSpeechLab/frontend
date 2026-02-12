import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PronunciationResultPage.css';

const PronunciationResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    // 전달받은 분석 결과 데이터
    const resultData = location.state || {
        item: { symbol: '?', word: '...', meaning: '' },
        grade: 'PENDING',
        feedback: '데이터를 불러오는 중입니다.',
        standardPitch: [],
        userPitch: []
    };

    const item = resultData.item || { symbol: '?', word: '?', meaning: '' };

    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (resultData.grade === 'EXCELLENT') {
            setShowCelebration(true);
        }
    }, [resultData.grade]);

    // 억양 그래프 그리기 (실제 데이터)
    useEffect(() => {
        const drawGraph = (canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // 캔버스 초기화
            ctx.clearRect(0, 0, width, height);

            // 데이터 없으면 중단
            const stdPitch = resultData.standardPitch || [];
            const usrPitch = resultData.userPitch || [];

            if (stdPitch.length === 0 && usrPitch.length === 0) return;

            // Y축 정규화를 위한 최대/최소값 계산 (여유분 10%)
            const allValues = [...stdPitch, ...usrPitch].filter(v => v > 0); // 0(무음) 제외
            if (allValues.length === 0) return;

            const minVal = Math.min(...allValues) * 0.9;
            const maxVal = Math.max(...allValues) * 1.1;
            const range = maxVal - minVal || 1; // 0나누기 방지

            // 헬퍼: 값 -> Y좌표 변환 (Canvas는 상단이 0이므로 반전)
            const getY = (val) => {
                if (val <= 0) return height; // 무음은 바닥에
                return height - ((val - minVal) / range) * height;
            };

            // 헬퍼: 그래프 그리기 함수
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

            // 1. 표준 그래프 (빨강)
            drawLine(stdPitch, '#e24a4aff');

            // 2. 유저 그래프 (초록)
            drawLine(usrPitch, '#00ff22ff');
        };

        drawGraph(canvasRef.current);
    }, [resultData]);

    const handlePlayWord = (word) => {
        if (resultData.userAudioUrl) {
            const audio = new Audio(resultData.userAudioUrl);
            audio.onerror = (e) => console.error("오디오 재생 에러:", e);
            audio.play().catch(e => console.error("재생 메서드 실패:", e));
        } else {
            console.warn('재생할 오디오 URL이 없습니다.');
            alert(`'${word}' 다시 듣기`);
        }
    };

    // Windows-1252(Latin-1 Sup)로 잘못 해석된 UTF-8 복구 (ResultPage용 안전장치) --> 삭제
    // DB 인코딩 수정 완료로 더 이상 변환 필요 X
    const fixEncoding = (str) => {
        if (!str || typeof str !== 'string') return str || '';
        return str;
    };

    return (
        <div className="result-container">
            <div className="result-header">
                <div>
                    <h1 className="subpage-title">학습 결과</h1>
                    <p style={{ color: '#ccc' }}>발음 정확도와 교정 가이드를 확인하세요.</p>
                </div>
                <div className="score-badge">
                    {resultData.grade}
                </div>
            </div>

            {/* 학습 대상 정보 (원래 있던 곳) */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {Array.isArray(resultData.wordSegments) && resultData.wordSegments.length > 0 ? (
                        resultData.wordSegments.map((word, wIdx) => {
                            // Score based coloring: >=80 Green, else Red
                            const isGood = (word.score || 0) >= 80;
                            const color = isGood ? '#28a745' : '#dc3545';
                            return (
                                <span key={wIdx} style={{ color: color, marginRight: '0.5rem' }}>
                                    {fixEncoding(word.word)}
                                </span>
                            );
                        })
                    ) : (
                        <span style={{ color: '#a67c00' }}>
                            {fixEncoding(item.word || item.symbol)}
                        </span>
                    )}
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>
                    <strong>
                        {/* 1. 분석 결과가 있으면 컬러풀한 IPA 표시 -> 삭제 (헤더에 통합됨) */}
                        {item.korPronunciation ? <span style={{ color: '#333' }}>{fixEncoding(item.korPronunciation)}</span> : ''}
                    </strong>
                    <span style={{ color: '#888', fontWeight: 400 }}> {item.meaning ? `- ${fixEncoding(item.meaning)}` : ''}</span>
                </p>
            </div>

            {/* 1. 억양 분석 (그래프) */}
            <div className="visual-section">
                <div className="graph-card">
                    <div className="graph-title">
                        <span>억양 분석</span>
                        <div style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                            <span style={{ color: '#e24a4aff', marginRight: '10px' }}>· 표준 발음</span>
                            <span style={{ color: '#00ff22ff' }}>· 내 발음</span>
                        </div>
                    </div>
                    <div className="pitch-box">
                        <canvas ref={canvasRef} width={800} height={150} style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>
            </div>

            {/* 2. 상세 분석 (영상 비교) */}
            <div className="visual-section">
                <div className="graph-card" style={{ textAlign: 'center' }}>
                    <div className="graph-title">상세 분석</div>

                    {/* 발음 기호 상세 분석 (카드 형태 레이아웃) */}
                    <div className="phoneme-analysis">
                        {Array.isArray(resultData.wordSegments) && resultData.wordSegments.length > 0 ? (
                            resultData.wordSegments
                                .filter(word => word.word && word.phonemes && word.phonemes.length > 0)
                                .map((word, wIdx) => {
                                    const isGood = (word.score || 0) >= 80;
                                    const scoreColor = isGood ? '#28a745' : '#dc3545';

                                    return (
                                        <div key={wIdx} className="word-segment-card">
                                            {/* 점수 뱃지 추가 */}
                                            <div className="word-score-badge" style={{ color: scoreColor, borderColor: scoreColor + '33' }}>
                                                {word.score}점
                                            </div>

                                            {/* 음소 나열 영역 */}
                                            <div className="phoneme-row">
                                                {word.phonemes.map((pho, pIdx) => (
                                                    <div key={pIdx} className="phoneme-item">
                                                        {/* 정답 발음 기호 */}
                                                        <span className="phoneme-symbol" style={{
                                                            color: pho.isCorrect ? '#28a745' : '#dc3545',
                                                            borderBottom: pho.isCorrect ? '2px solid transparent' : '2px solid #dc3545'
                                                        }}>
                                                            {pho.symbol}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 단어 텍스트 */}
                                            <div className="word-text-label">
                                                {word.word}
                                            </div>
                                        </div>
                                    );
                                })
                        ) : (
                            <p style={{ color: '#999' }}>상세 분석 데이터가 없습니다.</p>
                        )}
                    </div>

                    {/* 영상 비교 섹션 */}
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* 원어민 영상 */}
                        <div style={{ flex: 1, minWidth: '300px', maxWidth: '450px' }}>
                            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>원어민 발음</div>
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {resultData.nativeVideoUrl ? (
                                    <video
                                        src={resultData.nativeVideoUrl}
                                        controls
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        -
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 정답 입모양 */}
                        <div style={{ flex: 1, minWidth: '300px', maxWidth: '450px' }}>
                            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>정답 입모양</div>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '56.25%',
                                background: '#fff',
                                borderRadius: '12px',
                                border: '1px solid #eee',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {item.mouthShapeUrl ? (
                                    <img
                                        src={item.mouthShapeUrl}
                                        alt="입모양"
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '3rem' }}>

                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 내 녹음 */}
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#333', textAlign: 'left' }}>내 발음 다시 듣기</div>
                            <div style={{
                                padding: '1.5rem',
                                background: '#f8f9fa',
                                borderRadius: '12px',
                                border: '1px solid #eee',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '2rem' }}></div>
                                {resultData.userAudioUrl ? (
                                    <audio
                                        src={resultData.userAudioUrl}
                                        controls
                                        style={{ flex: 1 }}
                                    />
                                ) : (
                                    <div style={{ color: '#aaa', flex: 1 }}>
                                        녹음된 오디오 없음
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3.AI 피드백*/}
            <div className="visual-section">
                <div className="graph-card">
                    <div className="graph-title">AI 피드백</div>
                    <p style={{ fontSize: '1.2rem', color: '#555', lineHeight: '1.6', fontWeight: 500 }}>
                        {resultData.feedback}
                    </p>
                </div>
            </div>

            {/* 4. 컨트롤 버튼 (다시하기 / 다음단계) */}
            <div className="practice-controls" style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    className="record-btn-large"
                    style={{
                        flex: 1,
                        maxWidth: '280px', // 너무 늘어나지 않게 제한
                        borderRadius: '16px',
                        fontSize: '1.2rem',
                        height: '60px',
                        background: '#f1f3f5',
                        color: '#495057',
                        border: '1px solid #dee2e6',
                        cursor: 'pointer',
                        fontWeight: '700',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => {
                        // "다시 학습하기"
                        // ✅ 캐시 제거하여 최신 점수 반영
                        sessionStorage.removeItem('curriculum_data');
                        navigate('/pronunciationPractice', { state: { ...item, id: item.id } });
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#e9ecef';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f1f3f5';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    ↺ 다시 학습하기
                </button>
                <button
                    className="record-btn-large"
                    style={{
                        flex: 1,
                        maxWidth: '280px',
                        borderRadius: '16px',
                        fontSize: '1.2rem',
                        height: '60px',
                        background: '#a67c00',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(166, 124, 0, 0.3)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(166, 124, 0, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(166, 124, 0, 0.3)';
                    }}
                    onClick={() => {
                        // 1. 단어 결과 -> 예시 문장으로 이동 (있을 경우)
                        if (item.itemType === 'word' && item.examples && item.examples.length > 0) {
                            navigate('/pronunciationPractice', {
                                state: {
                                    ...item.examples[0],
                                    id: item.id,
                                    symbol: item.examples[0].ex_text,
                                    word: item.examples[0].ex_text,
                                    meaning: item.examples[0].ex_mean,
                                    itemType: 'example',
                                    allExamples: item.examples,
                                    currentIndex: 0,
                                    returnPath: '/learning'
                                }
                            });
                        }
                        // 2. 예시 문장 결과 -> 다음 예시 or 종료
                        else if (item.itemType === 'example') {
                            const nextIdx = (item.currentIndex || 0) + 1;
                            if (item.allExamples && nextIdx < item.allExamples.length) {
                                navigate('/pronunciationPractice', {
                                    state: {
                                        ...item.allExamples[nextIdx],
                                        id: item.id,
                                        symbol: item.allExamples[nextIdx].ex_text,
                                        word: item.allExamples[nextIdx].ex_text,
                                        meaning: item.allExamples[nextIdx].ex_mean,
                                        itemType: 'example',
                                        allExamples: item.allExamples,
                                        currentIndex: nextIdx,
                                        returnPath: '/learning'
                                    }
                                });
                            } else {
                                // ✅ 캐시 제거하여 최신 점수 반영
                                sessionStorage.removeItem('curriculum_data');
                                navigate('/learning');
                            }
                        }
                        // 3. 그 외 -> 종료
                        else {
                            // ✅ 캐시 제거하여 최신 점수 반영
                            sessionStorage.removeItem('curriculum_data');

                            // IPA 학습이었다면 발음기호 목록으로 이동
                            if (item.ipa && !item.itemType) { // itemType이 없는 경우(IPA 단독 학습) 등 체크
                                navigate('/pronunciation');
                            }
                            // 문장 학습이었다면 주제 목록으로 이동
                            else if (item.returnPath) {
                                navigate(item.returnPath);
                            } else {
                                navigate('/learning');
                            }
                        }
                    }}
                >
                    {(() => {
                        if (item.itemType === 'word' && item.examples && item.examples.length > 0) {
                            return '문장 연습하기';
                        }
                        if (item.itemType === 'example') {
                            const nextIdx = (item.currentIndex || 0) + 1;
                            if (item.allExamples && nextIdx < item.allExamples.length) {
                                return '다음 문장';
                            }
                            return '주제 선택하기';
                        }
                        return '주제 선택하기'; // 기본값
                    })()}
                </button>
            </div>
        </div>
    );
};

export default PronunciationResultPage;