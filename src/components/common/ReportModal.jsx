import React, { useState, useEffect } from 'react';
import { getIpaRadarStats, getIpaAiReport } from '../../api/user';
import PronunciationWeaknessRadar from './PronunciationWeaknessRadar';
import AiFeedback from './AiFeedback';
import './ReportModal.css';

// ----------------------------------------------------------------------------
// IPA 데이터 매핑 유틸리티
// ----------------------------------------------------------------------------
const TYPE_TO_CATEGORY = {
    vowel: 'vowel', semivowel: 'semivowel', glide: 'semivowel',
    plosive: 'plosive', stop: 'plosive', affricate: 'affricate',
    fricative: 'fricative', aspirate: 'aspirate', liquid: 'liquid',
    nasal: 'nasal', consonant: 'consonant'
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapIpaRadarData = (raw = {}) => {
    const koreanKeyMap = {
        'ë§ˆì°°ìŒ': '마찰음', 'íŒŒì—­ìŒ': '파열음', 'ë¹„ìŒ': '비음',
        'ë° ëª¨ìŒ': '반모음', 'ëª¨ìŒ': '모음', 'íŒŒì°¾ìŒ': '파찰음',
        'ê¸°ìŒ': '기식음', 'ìœ ìŒ': '유음'
    };
    const mapped = {};
    Object.entries(raw || {}).forEach(([rawType, symbols]) => {
        let normalizedType = koreanKeyMap[rawType] || String(rawType || '').trim().toLowerCase();
        const categoryKey = TYPE_TO_CATEGORY[normalizedType] || normalizedType;
        if (!categoryKey || !symbols || typeof symbols !== 'object') return;
        let totalCount = 0; let wrongCount = 0;
        const ipaStats = [];
        Object.entries(symbols).forEach(([symbol, stat]) => {
            const totalTryCount = toNumber(stat?.totalTryCount);
            const successCount = toNumber(stat?.successCount);
            const localWrongCount = Math.max(0, totalTryCount - successCount);
            totalCount += totalTryCount; wrongCount += localWrongCount;
            ipaStats.push({ ipa: symbol, wrongCount: localWrongCount, totalCount: totalTryCount });
        });
        mapped[categoryKey] = { wrongCount, totalCount, ipaStats };
    });
    return mapped;
};

const ReportModal = ({ studentId, studentNickname, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [aiReport, setAiReport] = useState('');

    useEffect(() => {
        const fetchStudentReport = async () => {
            setLoading(true);

            // 1. 레이더 차트 데이터 가져오기
            try {
                const statsRaw = await getIpaRadarStats(studentId);
                setStats(mapIpaRadarData(statsRaw));
            } catch (error) {
                console.error('학생 통계 로드 실패', error);
            }

            // 2. AI 리포트 가져오기
            try {
                const aiReportRaw = await getIpaAiReport(studentId);
                setAiReport(aiReportRaw);
            } catch (error) {
                console.error('AI 리포트 로드 실패', error);
                setAiReport('AI 리포트를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };
        if (studentId) fetchStudentReport();
    }, [studentId]);

    return (
        <div className="report-modal-backdrop" onClick={onClose}>
            <div className="report-modal-container" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h2>{studentNickname ? `${studentNickname} 학생 리포트` : '학생 발음 리포트'}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="report-modal-body">
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner" />
                            <p>학생 데이터를 분석 중입니다...</p>
                        </div>
                    ) : (
                        <div className="report-modal-grid">
                            <div className="report-modal-radar-col">
                                <PronunciationWeaknessRadar weaknessStats={stats} />
                            </div>
                            <div className="report-modal-ai-col">
                                <AiFeedback feedback={aiReport} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
