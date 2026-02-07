import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserCurriculumStats, getCurriculumListStatic } from '../../api/curriculum';
import stamp from '../../assets/img/stamp.png';
import ipaImg from '../../assets/img/ipa_img.png';
import wordImg from '../../assets/img/word_img.png';
import sentImg from '../../assets/img/sent_img.png';
import './LearningPage.css';

function LearningPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const modeParam = searchParams.get('mode');

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('daily');
    const [viewMode, setViewMode] = useState(null);

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
                if (code <= 255) bytes.push(code);
                else if (win1252Map[code]) bytes.push(win1252Map[code]);
                else return str;
            }
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch (e) { return str; }
    };

    const parseText = (textField) => {
        if (!textField) return { word: '', examples: [] };
        try {
            const parsed = typeof textField === 'string' ? JSON.parse(textField) : textField;
            return {
                word: fixEncoding(parsed.word || parsed.displayText || (typeof textField === 'string' ? textField : '')),
                examples: (parsed.examples || []).map(ex => ({
                    ex_text: fixEncoding(ex.ex_text),
                    ex_mean: fixEncoding(ex.ex_mean)
                }))
            };
        } catch (e) {
            return { word: fixEncoding(textField), examples: [] };
        }
    };

    const THEME_LABELS = {
        daily: '기본표현(일상)',
        travel: '여행',
        food: '음식',
        shopping: '쇼핑',
        business: '비즈니스 표현'
    };
    const CATEGORIES = ['daily', 'travel', 'food', 'shopping', 'business'];

    useEffect(() => {
        setViewMode(modeParam);

        const fetchData = async () => {
            if (!modeParam) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                let curriculumsStatic;
                const staticCacheKey = 'curriculums_static_v2';
                const staticCached = sessionStorage.getItem(staticCacheKey);
                const STATIC_CACHE_DURATION = 24 * 60 * 60 * 1000;

                if (staticCached) {
                    const { data, timestamp } = JSON.parse(staticCached);
                    if (Date.now() - timestamp < STATIC_CACHE_DURATION) {
                        curriculumsStatic = data;
                    }
                }

                if (!curriculumsStatic) {
                    const allPromises = CATEGORIES.map(categoryKey => {
                        const categoryName = THEME_LABELS[categoryKey];
                        return Promise.all([
                            getCurriculumListStatic('단어', categoryName).catch(() => []),
                            getCurriculumListStatic('문장', categoryName).catch(() => [])
                        ]).then(([wordData, sentenceData]) => ({
                            categoryKey, categoryName, wordData, sentenceData
                        }));
                    });

                    const results = await Promise.all(allPromises);
                    curriculumsStatic = results.map(({ categoryKey, categoryName, wordData, sentenceData }) => ({
                        id: categoryKey,
                        title: categoryName,
                        words: wordData.map(item => {
                            const parsed = parseText(item.text);
                            return {
                                id: item.id,
                                itemType: 'word',
                                displayText: parsed.word,
                                meaning: fixEncoding(item.meaning),
                                ipa: fixEncoding(item.ipa),
                                korPronunciation: fixEncoding(item.korPronunciation),
                                examples: parsed.examples,
                                inton: item.inton || item.intonData,
                                intonData: item.inton || item.intonData
                            };
                        }),
                        sentences: sentenceData.map(item => {
                            const parsed = parseText(item.text);
                            return {
                                id: item.id,
                                itemType: 'sentence',
                                displayText: parsed.word,
                                meaning: fixEncoding(item.meaning),
                                ipa: fixEncoding(item.ipa),
                                korPronunciation: fixEncoding(item.korPronunciation),
                                examples: parsed.examples,
                                inton: item.inton || item.intonData,
                                intonData: item.inton || item.intonData
                            };
                        })
                    }));
                    sessionStorage.setItem(staticCacheKey, JSON.stringify({ data: curriculumsStatic, timestamp: Date.now() }));
                }

                const stats = await getUserCurriculumStats();
                const statsMap = new Map(stats.map(s => [s.curriculumId, s]));

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

            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [modeParam]);

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

    if (!viewMode) {
        return (
            <div className="subpage-container selection-page">
                <h1 className="subpage-title">어떤 학습을 시작할까요?</h1>
                <p className="subpage-desc">원하는 학습 모드를 선택해 보세요.</p>
                <div className="learning-selection-grid">
                    <div className="selection-card pron" onClick={() => navigate('/pronunciation')}>
                        <div className="card-icon">
                            <img src={ipaImg} alt="발음기호" className="selection-card-img" />
                        </div>
                        <h2>발음기호</h2>
                        <p>영어의 기초가 되는<br />발음기호부터 차근차근</p>
                        <button className="select-btn">시작하기</button>
                    </div>
                    <div className="selection-card word" onClick={() => navigate('/learning?mode=WORD')}>
                        <div className="card-icon">
                            <img src={wordImg} alt="단어 학습" className="selection-card-img" />
                        </div>
                        <h2>단어 학습</h2>
                        <p>주제별 필수 단어로<br />어휘력을 쑥쑥</p>
                        <button className="select-btn">시작하기</button>
                    </div>
                    <div className="selection-card sentence" onClick={() => navigate('/learning?mode=SENTENCE')}>
                        <div className="card-icon">
                            <img src={sentImg} alt="문장 학습" className="selection-card-img" />
                        </div>
                        <h2>문장 학습</h2>
                        <p>실생활 문장을 통해<br />자연스러운 회화 연습</p>
                        <button className="select-btn">시작하기</button>
                    </div>
                </div>
            </div>
        );
    }

    const activeTopic = topics.find(t => t.id === activeFilter);
    const displayItems = activeTopic
        ? (viewMode === 'SENTENCE' ? (activeTopic.sentences || []) : (activeTopic.words || []))
        : [];

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">
                {viewMode === 'SENTENCE' ? '주제별 문장 학습' : '주제별 단어 학습'}
            </h1>
            <div className="tabs">
                {CATEGORIES.map(f => (
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
                    <div className="loading-state">로딩 중...</div>
                ) : displayItems.length === 0 ? (
                    <div className="empty-state">
                        {viewMode === 'WORD' ? '단어 데이터가 없습니다.' : '문장 데이터가 없습니다.'}
                    </div>
                ) : (
                    displayItems.map((item, idx) => (
                        <div key={idx} className="learning-card" onClick={() => handleItemClick(item)}>
                            {item.isCompleted && (
                                <div className="completed-stamp">
                                    <img src={stamp} alt="완료" />
                                </div>
                            )}
                            <h2 className="learning-text" style={{ fontSize: viewMode === 'SENTENCE' ? '1.2rem' : '1.8rem' }}>
                                {item.displayText}
                            </h2>
                            <p className="learning-sub">
                                {item.meaning}
                                {item.korPronunciation && <span className="kor-pron"> {item.korPronunciation}</span>}
                            </p>
                            {item.tryCount > 0 && (
                                <div className="stats-above-progress">
                                    <div className="stat-badge-left">{item.tryCount}회</div>
                                    <div className="stat-badge-right">{item.score || 0}점</div>
                                </div>
                            )}
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
}

export default LearningPage;