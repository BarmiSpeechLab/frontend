import React, { useMemo, useState } from 'react';
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

const PronunciationWeaknessRadar = ({ weaknessStats = {} }) => {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const data = useMemo(() => normalizeStats(weaknessStats), [weaknessStats]);
    const sortedData = useMemo(() => [...data].sort((a, b) => b.errorRate - a.errorRate), [data]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('vowel');

    const selectedCategory =
        sortedData.find((item) => item.id === selectedCategoryId) || sortedData[0] || null;

    const maxRate = useMemo(() => Math.max(...sortedData.map((item) => item.errorRate), 1), [sortedData]);

    const size = 320;
    const center = size / 2;
    const outerRadius = 110;
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

    return (
        <div className="weakness-radar-card">
            <div className="weakness-radar-header">
                <div className="weakness-radar-title-wrap">
                    <h3 className="weakness-radar-title">발음 취약점 분석</h3>
                    <button
                        type="button"
                        className="weakness-info-button"
                        aria-label="발음 분류 설명 보기"
                        onClick={() => setIsInfoOpen(true)}
                    >
                        i
                    </button>
                </div>
                <p className="weakness-radar-subtitle">오답률 높은 순 정렬</p>
            </div>

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
                            {point.label}
                        </text>
                    ))}
                </svg>

                <div className="weakness-radar-list">
                    {sortedData.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`weakness-radar-item ${selectedCategory?.id === item.id ? 'selected' : ''}`}
                            onClick={() => setSelectedCategoryId(item.id)}
                        >
                            <span>{item.label}</span>
                            <strong>{formatRate(item.errorRate)}</strong>
                        </button>
                    ))}
                </div>
            </div>

            <div className="weakness-detail-panel">
                <div className="weakness-detail-title">
                    {selectedCategory ? `${selectedCategory.label} IPA 오답 개수` : 'IPA 오답 개수'}
                </div>
                {selectedCategory?.ipaStats?.length ? (
                    <div className="weakness-detail-list">
                        {selectedCategory.ipaStats.map((ipa) => (
                            <div key={`${selectedCategory.id}-${ipa.ipa}`} className="weakness-detail-item">
                                <span className="ipa-symbol">{ipa.ipa}</span>
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

            {isInfoOpen && (
                <div className="weakness-info-backdrop" onClick={() => setIsInfoOpen(false)} role="presentation">
                    <div className="weakness-info-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="weakness-info-modal-header">
                            <h4>발음 분류 설명</h4>
                            <button type="button" className="weakness-info-close" onClick={() => setIsInfoOpen(false)} aria-label="닫기">
                                ×
                            </button>
                        </div>
                        <div className="weakness-info-list">
                            {CATEGORY_CONFIG.map((category) => (
                                <div key={category.id} className="weakness-info-item">
                                    <strong>{category.label}</strong>
                                    <p>{category.info}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PronunciationWeaknessRadar;
