import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './PronunciationWeaknessRadar.css';

const CATEGORY_CONFIG = [
    {
        id: 'vowel',
        label: '모음',
        aliases: ['모음', 'vowel'],
        info: '입안의 공기 흐름이 크게 막히지 않고 나는 소리'
    },
    {
        id: 'semivowel',
        label: '반모음',
        aliases: ['반모음', 'semivowel'],
        info: '모음과 자음의 성질을 함께 가지는 소리'
    },
    {
        id: 'plosive',
        label: '파열음',
        aliases: ['파열음', 'plosive'],
        info: '공기를 막았다가 터뜨리며 내는 소리'
    },
    {
        id: 'affricate',
        label: '파찰음',
        aliases: ['파찰음', 'affricate'],
        info: '파열 뒤 마찰이 이어지는 소리'
    },
    {
        id: 'fricative',
        label: '마찰음',
        aliases: ['마찰음', 'fricative'],
        info: '좁은 틈 사이로 공기를 마찰시키며 내는 소리'
    },
    {
        id: 'aspirate',
        label: '기식음',
        aliases: ['기식음', 'aspirate'],
        info: '숨이 강하게 섞여 나오는 소리'
    },
    {
        id: 'liquid',
        label: '유음',
        aliases: ['유음', 'liquid'],
        info: '혀 움직임이 부드럽게 이어지는 소리'
    },
    {
        id: 'nasal',
        label: '비음',
        aliases: ['비음', 'nasal'],
        info: '코를 통해 공기가 빠져나가며 나는 소리'
    }
];

const getNumericValue = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
};

const getPercent = (wrongCount, totalCount) => {
    if (!totalCount) return 0;
    return (wrongCount / totalCount) * 100;
};

const getCategoryRaw = (rawStats, aliases) => {
    const key = aliases.find((alias) => Object.prototype.hasOwnProperty.call(rawStats, alias));
    return key ? rawStats[key] : null;
};

const normalizeIpaList = (list = []) =>
    list
        .map((item) => {
            const wrongCount = getNumericValue(item?.wrongCount);
            const totalCount = getNumericValue(item?.totalCount);
            return {
                ipa: String(item?.ipa ?? '-'),
                wrongCount,
                totalCount,
                errorRate: getPercent(wrongCount, totalCount)
            };
        })
        .sort((a, b) => b.wrongCount - a.wrongCount);

const normalizeStats = (rawStats = {}) =>
    CATEGORY_CONFIG.map(({ id, label, aliases, info }) => {
        const raw = getCategoryRaw(rawStats, aliases);

        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const wrongCount = getNumericValue(raw.wrongCount);
            const totalCount = getNumericValue(raw.totalCount);
            return {
                id,
                label,
                info,
                wrongCount,
                totalCount,
                errorRate: getPercent(wrongCount, totalCount),
                ipaStats: normalizeIpaList(raw.ipaStats || [])
            };
        }

        const wrongCount = getNumericValue(raw);
        return {
            id,
            label,
            info,
            wrongCount,
            totalCount: wrongCount,
            errorRate: getPercent(wrongCount, wrongCount),
            ipaStats: []
        };
    });

const getPoint = (cx, cy, radius, angleRad) => ({
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
});

const formatRate = (rate) => `${rate.toFixed(1)}%`;

// Windows-1252(Latin-1 Sup)로 잘못 해석된 UTF-8 복구 (RadarChart용 안전장치)
const fixEncoding = (str) => {
    if (typeof str !== 'string' || !str) return str;
    if (/[가-힣]/.test(str)) return str; // 이미 한글이면 그대로 반환

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
        if (decoded.includes('\uFFFD')) return str; // 복구 실패 감지
        return decoded;
    } catch (e) {
        return str;
    }
};

const PronunciationWeaknessRadar = ({ weaknessStats = {} }) => {
    // const [isInfoOpen, setIsInfoOpen] = useState(false); // REMOVED global info toggle
    const [focusedCategoryInfo, setFocusedCategoryInfo] = useState(null); // NEW: Track clicked card info

    const data = useMemo(() => normalizeStats(weaknessStats), [weaknessStats]);
    const sortedData = useMemo(() => [...data].sort((a, b) => b.errorRate - a.errorRate), [data]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('vowel');

    const selectedCategory =
        sortedData.find((item) => item.id === selectedCategoryId) || sortedData[0] || null;

    const maxRate = useMemo(() => Math.max(...sortedData.map((item) => item.errorRate), 1), [sortedData]);

    const size = 380; // Increased size for padding
    const center = size / 2;
    const outerRadius = 100; /* Keep radius same, effectively adding padding */
    const levelCount = 4;

    const axisPoints = sortedData.map((item, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / sortedData.length;
        return {
            ...item,
            angle,
            outer: getPoint(center, center, outerRadius, angle),
            labelPosition: getPoint(center, center, outerRadius + 28, angle),
            valuePoint: getPoint(center, center, (item.errorRate / maxRate) * outerRadius, angle)
        };
    });

    const valuePolygonPoints = axisPoints
        .map((point) => `${point.valuePoint.x},${point.valuePoint.y}`)
        .join(' ');

    const handleCardClick = (item) => {
        setSelectedCategoryId(item.id);
        // Find configuration to get static info (description)
        const config = CATEGORY_CONFIG.find((c) => c.id === item.id);
        if (config) {
            setFocusedCategoryInfo({ ...item, ...config });
        }
    };

    return (
        <div className="weakness-radar-card">
            <div className="weakness-radar-header">
                <div className="weakness-radar-title-wrap">
                    <h3 className="weakness-radar-title">발음 취약점 분석</h3>
                    {/* INFO BUTTON REMOVED */}
                </div>
                <p className="weakness-radar-subtitle">오답률 높은 순 정렬</p>
            </div>

            {/* NEW: CARD GRID LAYOUT */}
            <div className="weakness-radar-layout">
                <svg className="weakness-radar-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="발음 취약점 레이더 차트">
                    {Array.from({ length: levelCount }).map((_, idx) => {
                        const ratio = (idx + 1) / levelCount;
                        const points = axisPoints
                            .map((point) => {
                                const p = getPoint(center, center, outerRadius * ratio, point.angle);
                                return `${p.x},${p.y}`;
                            })
                            .join(' ');
                        return <polygon key={`grid-${idx}`} points={points} className="radar-grid" />;
                    })}

                    {axisPoints.map((point) => (
                        <line
                            key={`axis-${point.id}`}
                            x1={center}
                            y1={center}
                            x2={point.outer.x}
                            y2={point.outer.y}
                            className="radar-axis"
                        />
                    ))}

                    <polygon points={valuePolygonPoints} className="radar-area" />

                    {axisPoints.map((point) => (
                        <circle
                            key={`point-${point.id}`}
                            cx={point.valuePoint.x}
                            cy={point.valuePoint.y}
                            r="4"
                            className={`radar-value-point ${selectedCategory?.id === point.id ? 'selected' : ''}`}
                        />
                    ))}

                    {axisPoints.map((point) => (
                        <text
                            key={`label-${point.id}`}
                            x={point.labelPosition.x}
                            y={point.labelPosition.y}
                            textAnchor={Math.cos(point.angle) > 0.35 ? 'start' : Math.cos(point.angle) < -0.35 ? 'end' : 'middle'}
                            dominantBaseline="middle"
                            className="radar-label"
                        >
                            {fixEncoding(point.label)}
                        </text>
                    ))}
                </svg>

                <div className="weakness-radar-list">
                    {sortedData.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`weakness-radar-item ${selectedCategory?.id === item.id ? 'selected' : ''}`}
                            onClick={() => handleCardClick(item)}
                        >
                            <div className="card-header-row">
                                <span>{fixEncoding(item.label)}</span>
                                <strong>{formatRate(item.errorRate)}</strong>
                            </div>

                            <div className="card-progress-bg">
                                <div
                                    className="card-progress-fill"
                                    style={{ width: `${item.errorRate}%` }}
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="weakness-detail-panel">
                <div className="weakness-detail-title">
                    {selectedCategory ? `${fixEncoding(selectedCategory.label)} IPA 오답 개수` : 'IPA 오답 개수'}
                </div>
                {selectedCategory?.ipaStats?.length ? (
                    <div className="weakness-detail-list">
                        {selectedCategory.ipaStats.map((ipa) => (
                            <div key={`${selectedCategory.id}-${ipa.ipa}`} className="weakness-detail-item">
                                <span className="ipa-symbol">{fixEncoding(ipa.ipa)}</span>
                                <div className="ipa-metrics">
                                    <span className="ipa-wrong-count">{ipa.wrongCount}회</span>
                                    <span className="ipa-rate">{formatRate(ipa.errorRate)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="weakness-detail-empty">해당 분류의 IPA 데이터가 없습니다.</div>
                )}
            </div>

            {focusedCategoryInfo && createPortal(
                <div className="weakness-info-backdrop" onClick={() => setFocusedCategoryInfo(null)} role="presentation">
                    <div className="weakness-info-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="weakness-info-modal-header">
                            <h4>{fixEncoding(focusedCategoryInfo.label)}</h4>
                            <button type="button" className="weakness-info-close" onClick={() => setFocusedCategoryInfo(null)} aria-label="닫기">
                                ×
                            </button>
                        </div>
                        <div className="weakness-info-content" style={{ padding: '1rem', background: '#fdfaf3', borderRadius: '10px', fontSize: '1.1rem', lineHeight: '1.6', color: '#6f6448' }}>
                            <p>{fixEncoding(focusedCategoryInfo.info)}</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PronunciationWeaknessRadar;
