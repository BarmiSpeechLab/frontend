import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';
import './AiFeedback.css';

const AiFeedback = ({ feedback }) => {

    // 텍스트 파싱 로직
    const parsedFeedback = useMemo(() => {
        if (!feedback) return [];

        // 줄바꿈으로 분리
        const lines = feedback.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        const sections = [];
        let currentSection = null;

        lines.forEach(line => {
            // 새로운 항목 시작 감지 (예: "- WORD ...", 숫자 리스트 등)
            // 보통 "- WORD (phoneme -> phoneme)" 형태
            const isTargetLine = line.match(/^-\s*[A-Z'a-z]+/);

            if (isTargetLine) {
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    target: line.replace(/^-\s*/, ''), // 앞의 "- " 제거
                    error: null,
                    correction: null
                };
            } else if (currentSection) {
                // 내용 파싱
                if (line.includes('틀린 점:') || line.includes('틀린 점.')) {
                    currentSection.error = line.replace(/.*틀린 점[:.]\s*/, '');
                } else if (line.includes('교정 방법:') || line.includes('교정 방법.')) {
                    currentSection.correction = line.replace(/.*교정 방법[:.]\s*/, '');
                } else {
                    // 기타 텍스트는 문맥에 따라 합침
                    if (!currentSection.error && !currentSection.correction) {
                        // 아직 분류되지 않은 추가 텍스트 (타겟의 연장선일 수도 있음)
                        currentSection.target += ' ' + line;
                    } else if (currentSection.correction) {
                        currentSection.correction += ' ' + line;
                    } else if (currentSection.error) {
                        currentSection.error += ' ' + line;
                    }
                }
            }
        });
        if (currentSection) sections.push(currentSection);

        // 파싱 실패 시 원본 텍스트 반환을 위한 처리
        if (sections.length === 0 && feedback.length > 0) {
            return [{ raw: feedback }];
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
        if (!text.includes('->')) return <span>{text}</span>;

        const parts = text.split('->');
        return (
            <span className="feedback-target-text">
                {parts[0]}
                <span className="target-arrow"><ArrowRight size={16} strokeWidth={3} /></span>
                {parts[1]}
            </span>
        );
    };

    return (
        <div className="feedback-card-container">
            <div className="feedback-header">
                <Sparkles size={20} fill="#a67c00" color="#a67c00" />
                <span className="feedback-header-title">AI 상세 코칭</span>
            </div>

            <div className="feedback-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {parsedFeedback.map((item, idx) => (
                    <div key={idx} className="feedback-item">
                        {item.raw ? (
                            <p className="feedback-content-text">{item.raw}</p>
                        ) : (
                            <>
                                <div className="feedback-target">
                                    🎯 {renderTargetText(item.target)}
                                </div>
                                {item.error && (
                                    <div className="feedback-detail-block">
                                        <div className="feedback-label-row">
                                            <div className="feedback-icon-wrapper error">
                                                <AlertTriangle size={18} />
                                            </div>
                                            <span className="feedback-label" style={{ color: '#d32f2f' }}>문제점</span>
                                        </div>
                                        <p className="feedback-content-text">
                                            {item.error}
                                        </p>
                                    </div>
                                )}
                                {item.correction && (
                                    <div className="feedback-detail-block">
                                        <div className="feedback-label-row">
                                            <div className="feedback-icon-wrapper correction">
                                                <CheckCircle size={18} />
                                            </div>
                                            <span className="feedback-label" style={{ color: '#2e7d32' }}>솔루션</span>
                                        </div>
                                        <p className="feedback-content-text">
                                            {item.correction}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiFeedback;
