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

    // 억양 그래프 (임시)
    useEffect(() => {
        const drawGraph = (canvas, isWaveform) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // 1. 표준 그래프
            ctx.beginPath();
            ctx.strokeStyle = '#e24a4aff';
            ctx.lineWidth = 3;
            ctx.moveTo(0, height / 2);
            for (let i = 0; i < width; i++) {
                ctx.lineTo(i, height / 2 + Math.sin(i * 0.05) * 40);
            }
            ctx.stroke();

            // 2. 유저 그래프
            ctx.beginPath();
            ctx.strokeStyle = '#00ff22ff';
            ctx.lineWidth = 3;
            ctx.moveTo(0, height / 2);
            for (let i = 0; i < width; i++) {
                ctx.lineTo(i, height / 2 + Math.sin(i * 0.05 + 0.2) * 35);
            }
            ctx.stroke();
        };

        drawGraph(canvasRef.current, false);
    }, []);

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

    // Windows-1252(Latin-1 Sup)로 잘못 해석된 UTF-8 복구 (ResultPage용 안전장치)
    const fixEncoding = (str) => {
        if (typeof str !== 'string' || !str) return str;
        if (/[가-힣]/.test(str)) return str;

        const win1252Map = {
            0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
            0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E,
            0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
            0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
        };

        try {
            const bytes = [];
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i);
                if (code <= 255) {
                    bytes.push(code);
                } else if (win1252Map[code]) {
                    bytes.push(win1252Map[code]);
                } else {
                    return str; // 정상 특수문자(IPA) 보존
                }
            }
            const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));

            if (decoded.includes('\uFFFD')) return str;
            return decoded;
        } catch (e) {
            return str;
        }
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
                <h1 style={{ fontSize: '3rem', color: '#a67c00', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {fixEncoding(item.word || item.symbol)}
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>
                    <strong>
                        {item.ipa ? `[${fixEncoding(item.ipa)}]` : (item.pronunciation ? `[${fixEncoding(item.pronunciation)}]` : '')}
                        {item.korPronunciation ? ` ${fixEncoding(item.korPronunciation)}` : ''}
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

                    {/* 발음 기호 */}
                    <div className="phoneme-analysis" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        {resultData.wordSegments ? resultData.wordSegments.map((word, wIdx) => (
                            <div key={wIdx} className="word-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="phoneme-row" style={{ display: 'flex', gap: '2px' }}>
                                    {word.phonemes.map((pho, pIdx) => (
                                        <div
                                            key={pIdx}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                        >
                                            <span style={{
                                                color: pho.isCorrect ? '#137333' : '#c5221f',
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                fontFamily: 'monospace',
                                                textDecoration: pho.isCorrect ? 'none' : 'underline',
                                                textUnderlineOffset: '4px'
                                            }}>
                                                {pho.symbol}
                                            </span>
                                            {!pho.isCorrect && (
                                                <span style={{ fontSize: '0.8rem', color: '#c5221f' }}>({pho.userSymbol})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>{word.word}</span>
                                </div>
                            </div>
                        )) : (
                            <p>분석 데이터가 없습니다.</p>
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
            <div className="practice-controls" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                    className="record-btn-large"
                    style={{
                        flex: 1,
                        borderRadius: '16px',
                        fontSize: '1.2rem',
                        height: '64px',
                        background: '#f8f9fa',
                        color: '#666',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => {
                        // "다시 학습하기" -> 연습 페이지로 현재 데이터 들고 복귀
                        navigate('/pronunciationPractice', { state: { ...item, id: item.id } }); // id 명시
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
                >
                    다시 학습하기
                </button>
                <button
                    className="record-btn-large"
                    style={{
                        borderRadius: '16px',
                        width: '100%',
                        fontSize: '1.2rem',
                        height: '64px',
                        background: '#a67c00',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(166, 124, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        fontWeight: 'bold'
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
                                    id: item.id, // 부모 단어 ID 유지 (분석용)
                                    symbol: item.examples[0].ex_text,
                                    word: item.examples[0].ex_text,
                                    meaning: item.examples[0].ex_mean,
                                    itemType: 'example', // 타입 변경
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
                                // 다음 예시로
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
                                // 예시 끝 -> 주제 선택으로
                                navigate('/learning');
                            }
                        }
                        // 3. 그 외 (문장 카드 등, 혹은 예시 끝) -> 종료
                        else {
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