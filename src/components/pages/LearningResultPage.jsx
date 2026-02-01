import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PronunciationResultPage.css';

const LearningResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state || {}; // { topic, mode, results }
    const { topic, mode, results = [] } = state;

    // 평균 점수 계산
    const totalScore = Math.round(results.reduce((acc, curr) => acc + (curr.score || 0), 0) / (results.length || 1));
    // 평균 등급 (임시)
    const averageGrade = totalScore >= 90 ? 'EXCELLENT' : totalScore >= 70 ? 'GOOD' : 'BAD';

    const handleNextStep = () => {
        if (mode === 'WORD') {
            // 단어 학습 끝 -> 문장 학습으로 이동
            // 다음 단계(문장) 위해서 step: 0, accumulatedResults 초기화
            navigate('/learning/practice', {
                state: {
                    topic: topic,
                    mode: 'SENTENCE',
                    step: 0,
                    accumulatedResults: []
                }
            });
        } else {
            // 문장 학습 끝 -> 완료 (목록으로)
            alert('학습을 완료했습니다.');
            navigate('/learning');
        }
    };

    if (!topic) return <div>데이터가 없습니다.</div>;

    return (
        <div className="result-container">
            <div className="result-header">
                <div>
                    <h1 className="subpage-title">{mode === 'WORD' ? '단어 학습 리포트' : '문장 학습 리포트'}</h1>
                    <p style={{ color: '#ccc' }}>
                        {mode === 'WORD' ? '단어 학습이 완료되었습니다. 결과를 확인하세요.' : '문장 학습까지 모두 완료되었습니다!'}
                    </p>
                </div>
                <div className="score-badge">
                    {averageGrade}
                </div>
            </div>

            {/* 1. 종합 점수 */}
            <div className="visual-section">
                <div className="graph-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="graph-title" style={{ justifyContent: 'center' }}>종합 점수</div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#333', margin: '1rem 0' }}>
                        {totalScore}<span style={{ fontSize: '1.5rem', color: '#999' }}>점</span>
                    </div>
                    <p style={{ color: '#666' }}>
                        {mode === 'WORD'
                            ? '안정적입니다 ?'
                            : '훌륭하네요 ..'}
                    </p>
                </div>
            </div>

            {/* 2. 상세 결과 리스트 */}
            <div className="visual-section">
                <div className="graph-card">
                    <div className="graph-title">상세 결과</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {results.map((res, idx) => (
                            <li key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1.2rem',
                                borderBottom: idx !== results.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: '#f5f5f5', color: '#999', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                                            {res.item.word || res.item.sentence}
                                        </span>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>{res.item.meaning}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        color: res.grade === 'EXCELLENT' ? '#137333' : res.grade === 'GOOD' ? '#1a73e8' : '#e24a4aff',
                                        fontWeight: 'bold', fontSize: '1rem'
                                    }}>
                                        {res.grade}
                                    </span>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{res.score}점</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 3. 다음 단계 버튼 */}
            <div className="practice-controls" style={{ marginTop: '2rem' }}>
                <button
                    className="record-btn-large"
                    style={{ borderRadius: '12px', width: '100%', fontSize: '1.2rem', height: '60px' }}
                    onClick={handleNextStep}
                >
                    {mode === 'WORD' ? '문장 학습으로 이동' : '학습 완료'}
                </button>
            </div>
        </div>
    );
};

export default LearningResultPage;
