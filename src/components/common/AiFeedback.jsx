import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './AiFeedback.css';
import successImg from '../../assets/img/conversation_success.png';

const AiFeedback = ({ feedback }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const isSuccessCase = useMemo(() => {
        if (!feedback) return false;
        const textToCheck = typeof feedback === 'object'
            ? (feedback.summary || feedback.analysisResult || feedback.analysis_result || '')
            : String(feedback);
        // "물론입니다"가 포함되어 있으면 성공 케이스로 간주
        return /물론입니다/.test(textToCheck);
    }, [feedback]);

    // 피드백이 변경될 때마다 인덱스 초기화
    useEffect(() => {
        setCurrentIndex(0);
    }, [feedback]);

    // 텍스트 파싱 로직
    const parsedFeedback = useMemo(() => {
        if (!feedback) return [];

        // 만약 피드백이 이미 객체(IpaAnalysisResponse)라면 파싱 생략
        if (typeof feedback === 'object' && feedback !== null) {
            return [{
                isStructured: true,
                summary: feedback.summary,
                strengths: feedback.strengths,
                weaknesses: feedback.weaknesses,
                teachingStrategies: feedback.teachingStrategies,
                overallLevel: feedback.overallLevel
            }];
        }

        // 스트링인 경우에만 replace 호출
        const normalizedFeedback = String(feedback)
            .replace(/\s*-\s*틀린 점[:.]/g, '\n틀린 점:')
            .replace(/\s*-\s*교정 방법[:.]/g, '\n교정 방법:');

        const lines = normalizedFeedback.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const sections = [];
        let currentSection = null;

        lines.forEach(line => {
            // 마크다운 볼드(**) 및 구분선(---) 정리
            let cleanLine = line.replace(/^\*\*|\*\*$/g, '').replace(/---/g, '').trim();
            if (!cleanLine) return;

            // 새로운 항목 시작 감지 (예: "- WORD ...", "WORD (phonemes)...", "WORD [phonemes]...")
            // 단어/기호로 시작하고 괄호를 포함하는 경우 타겟으로 간주
            const isTargetLine = cleanLine.match(/^[-]?\s*(.*[([].*->.*[\])].*)/) || cleanLine.match(/^[-]?\s*(.*교정 필요 없음.*)/);

            if (isTargetLine) {
                if (currentSection) sections.push(currentSection);

                // "- " 제거 및 " - 교정 필요 없음" 분리 처리
                let processedLine = cleanLine.replace(/^[-]\s*/, '');
                let extraInfo = null;

                if (processedLine.includes(' - 교정 필요 없음')) {
                    extraInfo = '교정 필요 없음';
                    processedLine = processedLine.replace(' - 교정 필요 없음', '').trim();
                }

                currentSection = {
                    target: processedLine,
                    error: null,
                    correction: extraInfo,
                    isNoAction: !!extraInfo
                };
            } else if (currentSection) {
                // 내용 파싱 (마크다운 볼드 제거 자리에 cleanLine 사용)
                if (cleanLine.includes('틀린 점:') || cleanLine.includes('틀린 점.')) {
                    currentSection.error = cleanLine.replace(/.*틀린 점[:.]\s*/, '');
                } else if (cleanLine.includes('교정 방법:') || cleanLine.includes('교정 방법.')) {
                    currentSection.correction = cleanLine.replace(/.*교정 방법[:.]\s*/, '');
                } else {
                    // 기타 텍스트는 문맥에 따라 합침
                    if (!currentSection.error && !currentSection.correction) {
                        currentSection.target += ' ' + cleanLine;
                    } else if (currentSection.correction) {
                        currentSection.correction += ' ' + cleanLine;
                    } else if (currentSection.error) {
                        currentSection.error += ' ' + cleanLine;
                    }
                }
            }
        });
        if (currentSection) sections.push(currentSection);

        // 파싱 실패 시 원본 텍스트 반환을 위한 처리
        if (sections.length === 0 && feedback) {
            return [{ raw: String(feedback) }];
        }

        return sections;
    }, [feedback]);


    if (!feedback) {
        return (
            <div className="feedback-card-container">
                <div className="feedback-header">
                    <Sparkles size={24} color="#a67c00" />
                    <span className="feedback-header-title">AI 피드백</span>
                </div>
                <div className="feedback-placeholder">
                    <HelpCircle size={40} color="#e0e0e0" />
                    <p className="feedback-loading-text">발음 분석 전입니다. 녹음 후 결과를 확인해보세요.</p>
                </div>
            </div>
        );
    }

    const renderTargetText = (text) => {
        // () 또는 [] 괄호 부분을 찾아서 분리
        // 예: "THINK ([sɪŋk] -> [θɪŋk])"
        const match = text.match(/^(.*?)\s*([([].*[\])])$/);

        if (!match) return <span>{text}</span>;

        const [_, word, phonemes] = match;

        // 괄호 제거 후 "->"로 분리
        const phonemeParts = phonemes.replace(/[()[\]]/g, '').split('->');

        const cleanPhoneme = (part) => {
            if (!part) return '';
            // "사용자 발음:", "정답 발음:", "내 발음:", "정확한 발음:" 등 제거
            return part.replace(/.*발음\s*[:]\s*/, '').trim();
        };

        const cleanWord = word.replace(/\*\*/g, '').trim();

        return (
            <div className="feedback-target-container">
                <div className="feedback-target-word">
                    🎯 {cleanWord}
                </div>
                {phonemeParts.length > 1 ? (
                    <div className="feedback-target-phonemes">
                        <span className="phoneme-wrap">
                            <span className="phoneme-label">내 발음:</span>
                            <span className="phoneme-value">{cleanPhoneme(phonemeParts[0])}</span>
                            <span className="target-arrow"><ArrowRight size={14} strokeWidth={3} /></span>
                            <span className="phoneme-label">정답:</span>
                            <span className="phoneme-value">{cleanPhoneme(phonemeParts[1])}</span>
                        </span>
                    </div>
                ) : (
                    <div className="feedback-target-phonemes">{phonemes}</div>
                )}
            </div>
        );
    };

    return (
        <div className="feedback-card-container">
            <div className="feedback-header">
                <Sparkles size={20} fill="#a67c00" color="#a67c00" />
                <span className="feedback-header-title">AI 상세 코칭</span>
            </div>

            <div className="feedback-list">
                {isSuccessCase ? (
                    <div className="feedback-success-state">
                        <img src={successImg} alt="완벽합니다!" className="feedback-success-img" />
                        <h4 className="feedback-success-title" style={{ margin: 0 }}>완벽합니다!</h4>
                    </div>
                ) : (
                    parsedFeedback.length > 0 && (
                        <div className="feedback-item">
                            {parsedFeedback[currentIndex].isStructured ? (
                                <div className="feedback-structured-content">
                                    {parsedFeedback[currentIndex].overallLevel && (
                                        <div className="feedback-level-badge">
                                            종합 레벨: <span>{parsedFeedback[currentIndex].overallLevel}</span>
                                        </div>
                                    )}

                                    <div className="feedback-detail-block">
                                        <div className="feedback-label-row">
                                            <div className="feedback-icon-wrapper summary"><Sparkles size={18} /></div>
                                            <span className="feedback-label">학습 요약</span>
                                        </div>
                                        <p className="feedback-content-text">{parsedFeedback[currentIndex].summary}</p>
                                    </div>

                                    {parsedFeedback[currentIndex].strengths?.length > 0 && (
                                        <div className="feedback-detail-block">
                                            <div className="feedback-label-row">
                                                <div className="feedback-icon-wrapper strength"><CheckCircle size={18} /></div>
                                                <span className="feedback-label" style={{ color: '#2e7d32' }}>주요 강점</span>
                                            </div>
                                            <ul className="feedback-list-text">
                                                {parsedFeedback[currentIndex].strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {parsedFeedback[currentIndex].weaknesses?.length > 0 && (
                                        <div className="feedback-detail-block">
                                            <div className="feedback-label-row">
                                                <div className="feedback-icon-wrapper weakness"><AlertTriangle size={18} /></div>
                                                <span className="feedback-label" style={{ color: '#d32f2f' }}>개선 필요점</span>
                                            </div>
                                            <ul className="feedback-list-text">
                                                {parsedFeedback[currentIndex].weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {parsedFeedback[currentIndex].teachingStrategies?.length > 0 && (
                                        <div className="feedback-detail-block teaching-guide">
                                            <div className="feedback-label-row">
                                                <div className="feedback-icon-wrapper guide"><HelpCircle size={18} /></div>
                                                <span className="feedback-label" style={{ color: '#a67c00' }}>튜터 티칭 가이드</span>
                                            </div>
                                            <ul className="feedback-list-text">
                                                {parsedFeedback[currentIndex].teachingStrategies.map((g, i) => <li key={i}>{g}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : parsedFeedback[currentIndex].raw ? (
                                <div className="feedback-raw-content">
                                    <div className="feedback-target">
                                        🎯 AI 분석 결과
                                    </div>
                                    <p className="feedback-content-text" style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                                        {parsedFeedback[currentIndex].raw}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="feedback-target">
                                        {renderTargetText(parsedFeedback[currentIndex].target)}
                                    </div>

                                    {parsedFeedback[currentIndex].isNoAction ? (
                                        <div className="feedback-detail-block">
                                            <div className="feedback-label-row">
                                                <div className="feedback-icon-wrapper correction">
                                                    <CheckCircle size={18} />
                                                </div>
                                                <span className="feedback-label" style={{ color: '#2e7d32' }}>상태</span>
                                            </div>
                                            <p className="feedback-content-text">
                                                정상 발음입니다. 별도의 교정이 필요하지 않습니다.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {parsedFeedback[currentIndex].error && (
                                                <div className="feedback-detail-block">
                                                    <div className="feedback-label-row">
                                                        <div className="feedback-icon-wrapper error">
                                                            <AlertTriangle size={18} />
                                                        </div>
                                                        <span className="feedback-label" style={{ color: '#d32f2f' }}>문제점</span>
                                                    </div>
                                                    <p className="feedback-content-text">
                                                        {parsedFeedback[currentIndex].error}
                                                    </p>
                                                </div>
                                            )}
                                            {parsedFeedback[currentIndex].correction && (
                                                <div className="feedback-detail-block">
                                                    <div className="feedback-label-row">
                                                        <div className="feedback-icon-wrapper correction">
                                                            <CheckCircle size={18} />
                                                        </div>
                                                        <span className="feedback-label" style={{ color: '#2e7d32' }}>솔루션</span>
                                                    </div>
                                                    <p className="feedback-content-text">
                                                        {parsedFeedback[currentIndex].correction}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )
                )}

                {/* 네비게이션 컨트롤 (여러 개일 때만 표시) */}
                {parsedFeedback.length > 1 && (
                    <div className="feedback-navigation">
                        <button
                            className="nav-btn"
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="page-indicator">
                            <strong>{currentIndex + 1}</strong> / {parsedFeedback.length}
                        </span>
                        <button
                            className="nav-btn"
                            onClick={() => setCurrentIndex(prev => Math.min(parsedFeedback.length - 1, prev + 1))}
                            disabled={currentIndex === parsedFeedback.length - 1}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiFeedback;
