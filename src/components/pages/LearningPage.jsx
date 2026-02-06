import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurriculumList, getCurriculumDetail, getUserCurriculumStats, getCurriculumListStatic } from '../../api/curriculum';
import stamp from '../../assets/img/stamp.png'; // ✅ 바로미 완료 도장
import './LearningPage.css';

function LearningPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // URL 쿼리 파라미터에서 mode 읽기 (기본값: 'WORD')
    const searchParams = new URLSearchParams(location.search);
    const modeParam = searchParams.get('mode'); // 'WORD' or 'SENTENCE' or null

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('daily');

    // modeState: 'WORD' | 'SENTENCE' (기본값은 WORD, 하지만 URL 파라미터가 있으면 그것을 따름)
    const [viewMode, setViewMode] = useState('WORD');

    useEffect(() => {
        if (modeParam === 'SENTENCE') {
            setViewMode('SENTENCE');
        } else {
            setViewMode('WORD');
        }
    }, [modeParam]);

    const THEME_LABELS = {
        daily: '기본표현(일상)', // DB: '기본표현(일상)'
        travel: '여행',
        food: '음식',
        shopping: '쇼핑',
        business: '비즈니스 표현' // DB: '비즈니스 표현'
    };

    // 한글 현상 깨짐 해결 -> 깨짐 현상 없을 경우 삭제해도 됨. 코드 남아있어도 문제는 X
    const CATEGORIES = ['daily', 'travel', 'food', 'shopping', 'business'];

    // Windows-1252(Latin-1 Sup)로 잘못 해석된 UTF-8 복구
    const fixEncoding = (str) => {
        if (typeof str !== 'string' || !str) return str;

        // 1. 이미 한글이 포함된 경우 (정상 데이터) -> 건드리지 않음
        if (/[가-힣]/.test(str)) return str;

        // Windows-1252 특수 문자 매핑 (Unicode -> Byte 0x80~0x9F)
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
                    // 2. [수정됨] 255보다 큰데 매핑에도 없다? => 정상적인 특수문자(IPA)일 가능성 99.9%
                    return str;
                }
            }
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch (e) {
            return str;
        }
    };

    // text 필드 파싱 (JSON에서 word, examples 추출)
    const parseText = (textField) => {
        if (!textField) return { word: '', examples: [] };

        // 1. 먼저 JSON 파싱 시도 (원본 그대로)
        try {
            // 만약 textField가 객체라면 바로 사용
            const parsed = typeof textField === 'string' ? JSON.parse(textField) : textField;

            return {
                // 파싱 후 각 필드에 대해 인코딩 복구 수행
                word: fixEncoding(parsed.word || parsed.displayText || (typeof textField === 'string' ? textField : '')),
                examples: (parsed.examples || []).map(ex => ({
                    ex_text: fixEncoding(ex.ex_text),
                    ex_mean: fixEncoding(ex.ex_mean) // 여기서 한글은 보존됨
                }))
            };
        } catch (e) {
            // JSON 파싱 실패 시: 일반 문자열로 취급하여 복구 시도
            const fixed = fixEncoding(textField);
            return { word: fixed, examples: [] };
        }
    };

    useEffect(() => {
        // ✅ API 분리: 커리큘럼(정적) + Stats(동적)
        const fetchData = async () => {
            try {
                // =======================================================
                // 1단계: 커리큘럼 정보 조회 (정적, 장기 캐싱 - 1일)
                // =======================================================
                let curriculumsStatic;
                const staticCacheKey = 'curriculums_static';
                const staticCached = sessionStorage.getItem(staticCacheKey);
                const STATIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1일

                if (staticCached) {
                    try {
                        const { data, timestamp } = JSON.parse(staticCached);
                        const cacheAge = Date.now() - timestamp;

                        if (cacheAge < STATIC_CACHE_DURATION) {
                            console.log('[Static Cache Hit] 커리큘럼 정보 로드 (캐시 나이:', Math.round(cacheAge / 3600000), '시간)');
                            curriculumsStatic = data;
                        } else {
                            console.log('[Static Cache Expired] 커리큘럼 재조회');
                        }
                    } catch (e) {
                        console.warn('Static 캐시 파싱 실패:', e);
                    }
                }

                // 캐시가 없으면 API 호출
                if (!curriculumsStatic) {
                    console.log('[Fetching Static] 커리큘럼 정보 병렬 조회 시작');
                    const allPromises = CATEGORIES.map(categoryKey => {
                        const categoryName = THEME_LABELS[categoryKey] || categoryKey;
                        return Promise.all([
                            getCurriculumListStatic('단어', categoryName).catch(() => []),
                            getCurriculumListStatic('문장', categoryName).catch(() => [])
                        ]).then(([wordData, sentenceData]) => ({
                            categoryKey,
                            categoryName,
                            wordData,
                            sentenceData
                        }));
                    });

                    const results = await Promise.all(allPromises);

                    // 커리큘럼 데이터 가공 (Stats 없음)
                    curriculumsStatic = results
                        .filter(({ wordData, sentenceData }) => wordData.length > 0 || sentenceData.length > 0)
                        .map(({ categoryKey, categoryName, wordData, sentenceData }) => ({
                            id: categoryKey,
                            title: categoryName,
                            words: wordData.map(item => {
                                const parsed = parseText(item.text);
                                return {
                                    id: item.id,
                                    itemType: fixEncoding(item.type) === '단어' ? 'word' : 'sentence',
                                    displayText: parsed.word,
                                    examples: parsed.examples.map(ex => ({
                                        ex_text: fixEncoding(ex.ex_text),
                                        ex_mean: fixEncoding(ex.ex_mean)
                                    })),
                                    meaning: fixEncoding(item.meaning),
                                    ipa: fixEncoding(item.ipa),
                                    korPronunciation: fixEncoding(item.korPronunciation)
                                };
                            }),
                            sentences: sentenceData.map(item => {
                                const parsed = parseText(item.text);
                                return {
                                    id: item.id,
                                    itemType: 'sentence',
                                    displayText: parsed.word,
                                    examples: parsed.examples,
                                    meaning: fixEncoding(item.meaning),
                                    ipa: fixEncoding(item.ipa),
                                    korPronunciation: fixEncoding(item.korPronunciation)
                                };
                            })
                        }));

                    // Static 데이터 캐싱
                    sessionStorage.setItem(staticCacheKey, JSON.stringify({
                        data: curriculumsStatic,
                        timestamp: Date.now()
                    }));
                    console.log('[Fetching Static] 완료 및 캐싱');
                }

                // =======================================================
                // 2단계: 사용자 통계 조회 (동적, 캐싱 없음, 매번 조회)
                // =======================================================
                console.log('[Fetching Stats] 사용자 통계 조회');
                const stats = await getUserCurriculumStats();
                const statsMap = new Map(stats.map(s => [s.curriculumId, s]));
                console.log('[Fetching Stats] 완료, 통계 개수:', stats.length);

                // =======================================================
                // 3단계: 병합 (Curriculum + Stats)
                // =======================================================
                const mergedTopics = curriculumsStatic.map(topic => {
                    const mergeItems = (items) => items.map(item => {
                        const stat = statsMap.get(item.id) || { score: 0, tryCount: 0, grade: null };
                        return {
                            ...item,
                            score: stat.score,
                            tryCount: stat.tryCount,
                            grade: stat.grade,
                            isCompleted: stat.tryCount > 0
                        };
                    });

                    const mergedWords = mergeItems(topic.words);
                    const mergedSentences = mergeItems(topic.sentences);

                    // Progress 계산
                    const wordProgress = mergedWords.length > 0
                        ? Math.round((mergedWords.filter(w => w.isCompleted).length / mergedWords.length) * 100)
                        : 0;
                    const sentenceProgress = mergedSentences.length > 0
                        ? Math.round((mergedSentences.filter(s => s.isCompleted).length / mergedSentences.length) * 100)
                        : 0;

                    return {
                        ...topic,
                        words: mergedWords,
                        sentences: mergedSentences,
                        wordProgress,
                        sentenceProgress,
                        progress: Math.round((wordProgress + sentenceProgress) / 2)
                    };
                });

                setTopics(mergedTopics);
                console.log('[Merge Complete] 커리큘럼 + Stats 병합 완료');
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location.pathname]); // ✅ location 변경 시 재실행 (Stats만 다시 조회)

    const handleItemClick = (item) => {
        const practiceItem = {
            ...item,
            symbol: item.displayText,
            word: item.displayText,
            meaning: item.meaning,
            itemType: item.itemType,
            ipa: item.ipa,
            korPronunciation: item.korPronunciation,
            examples: item.examples,
            returnPath: `/learning${location.search}`,
        };
        navigate(`/pronunciationPractice${location.search}`, { state: practiceItem });
    };

    const activeTopic = topics.find(t => t.id === activeFilter);

    // viewMode에 따라 보여줄 아이템 결정
    const displayItems = activeTopic
        ? (viewMode === 'SENTENCE' ? (activeTopic.sentences || []) : (activeTopic.words || []))
        : [];

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">
                {viewMode === 'SENTENCE' ? '주제별 문장 학습' : '주제별 단어 학습'}
            </h1>

            <div className="tabs">
                {['daily', 'travel', 'food', 'shopping', 'business'].map(f => (
                    <button
                        key={f}
                        className={`tab-btn ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {THEME_LABELS[f]}
                    </button>
                ))}
            </div>

            <div className="card-grid col-3">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>로딩 중...</div>
                ) : displayItems.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                        {viewMode === 'WORD' ? '단어 데이터가 없습니다.' : '문장 데이터가 없습니다.'}
                    </div>
                ) : (
                    displayItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="learning-card"
                            onClick={() => handleItemClick(item)}
                        >
                            {/* 완료 뱃지 → 바로미 완료 도장 (오른쪽 상단) */}
                            {item.isCompleted && (
                                <div className="completed-stamp">
                                    <img src={stamp} alt="완료" />
                                </div>
                            )}

                            <h2 className="learning-text" style={{ fontSize: viewMode === 'SENTENCE' ? '1.2rem' : '1.8rem' }}>{item.displayText}</h2>
                            <p className="learning-sub">
                                {item.meaning}
                                {item.korPronunciation && <span className="kor-pron"> {item.korPronunciation}</span>}
                            </p>

                            {/* Stats Badges (진행 바 위쪽 양 사이드) */}
                            {item.tryCount > 0 && (
                                <div className="stats-above-progress">
                                    <div className="stat-badge-left">
                                        {item.tryCount}회
                                    </div>
                                    <div className="stat-badge-right">
                                        {item.score || 0}점
                                    </div>
                                </div>
                            )}

                            {/* 진행 바 (카드 최하단) */}
                            <div className="learning-progress-bg">
                                <div
                                    className="learning-progress-fill"
                                    style={{
                                        width: item.tryCount > 0 ? '100%' : '0%',
                                        backgroundColor: item.isCompleted ? '#4CAF50' : '#a67c00'
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LearningPage;
