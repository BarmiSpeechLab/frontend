import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurriculumList, getCurriculumDetail } from '../../api/curriculum';
import './LearningPage.css';

function LearningPage() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('daily');

    const THEME_LABELS = {
        daily: '일상',
        travel: '여행',
        food: '음식',
        shopping: '쇼핑',
        business: '비즈니스'
    };

    // 한글 현상 깨짐 해결 -> 깨짐 현상 없을 경우 삭제해도 됨. 코드 남아있어도 문제는 X
    const CATEGORIES = ['daily', 'travel', 'food', 'shopping', 'business'];
    const ITEMS_PER_CATEGORY = 10;
    const WORD_START_ID = 41;
    const SENTENCE_START_ID = 91;
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
                    bytes.push(0x20); // 매핑되지 않는 문자는 공백 처리
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

        // 인코딩 보정
        const fixedText = fixEncoding(textField);

        if (typeof fixedText === 'object') {
            return {
                word: fixedText.word || '',
                examples: fixedText.examples || []
            };
        }

        if (typeof fixedText === 'string') {
            try {
                const parsed = JSON.parse(fixedText);
                return {
                    word: parsed.word || parsed.displayText || fixedText,
                    examples: parsed.examples || []
                };
            } catch (e) {
                return { word: fixedText, examples: [] };
            }
        }
        return { word: String(fixedText), examples: [] };
    };

    useEffect(() => {
        // 데이터 페칭
        const fetchData = async () => {
            try {
                const topicsList = [];

                for (let i = 0; i < CATEGORIES.length; i++) {
                    const categoryKey = CATEGORIES[i];
                    const categoryName = THEME_LABELS[categoryKey] || categoryKey;

                    const wordBaseId = WORD_START_ID + (i * ITEMS_PER_CATEGORY);
                    const sentenceBaseId = SENTENCE_START_ID + (i * ITEMS_PER_CATEGORY);

                    console.log(`[Fetching] ${categoryName} (Words: ${wordBaseId}~${wordBaseId + 9}, Sentences: ${sentenceBaseId}~${sentenceBaseId + 9})`);

                    /* 
                     * !! 한글 깨짐 이슈 없을 시 아래 방식이 효율적
                     * 현재는 안전한 ID 조회(Loop 방식)를 사용 중입니다.
                     * 
                     * // Bulk 조회 방식
                     * const wordData = await getCurriculumList('단어', categoryName);
                     * const sentenceData = await getCurriculumList('문장', categoryName);
                     * 
                     * if (wordData) {
                     *    topicsList.push({
                     *        id: categoryKey,
                     *        title: categoryName,
                     *        words: wordData.map(item => ({ ...item, displayText: parseText(item.text).word })),
                     *        sentences: sentenceData ? sentenceData.map(item => ({ ...item, displayText: parseText(item.text).word })) : []
                     *    });
                     * }
                     */

                    // =========================================================
                    // ID 기반 반복 조회 (인코딩 문제 우회용)
                    // =========================================================

                    // 1. 단어 데이터 가져오기 (10개)
                    const wordPromises = [];
                    for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
                        wordPromises.push(getCurriculumDetail(wordBaseId + j).catch(() => null));
                    }

                    // 2. 문장 데이터 가져오기 (10개)
                    const sentencePromises = [];
                    for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
                        sentencePromises.push(getCurriculumDetail(sentenceBaseId + j).catch(() => null));
                    }
                    // =========================================================================================

                    const [wordsResults, sentencesResults] = await Promise.all([
                        Promise.all(wordPromises),
                        Promise.all(sentencePromises)
                    ]);

                    // null 제거 (실패한 요청 제외)
                    const validWords = wordsResults.filter(item => item !== null);
                    const validSentences = sentencesResults.filter(item => item !== null);

                    if (validWords.length > 0 || validSentences.length > 0) {
                        // 데이터 가공
                        const processItems = (items) => {
                            // 진행률 계산
                            // isCompleted, score, tryCount가 item에 직접 포함됨
                            const completedCount = items.filter(item => item.isCompleted).length;
                            const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

                            return {
                                list: items.map(item => {
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
                                        korPronunciation: fixEncoding(item.korPronunciation),
                                        tryCount: item.tryCount || 0,
                                        isCompleted: item.isCompleted
                                    };
                                }),
                                progress
                            };
                        };

                        const wordData = processItems(validWords);
                        const sentenceData = processItems(validSentences);

                        topicsList.push({
                            id: categoryKey,
                            title: categoryName,
                            progress: Math.round((wordData.progress + sentenceData.progress) / 2),
                            words: wordData.list,
                            sentences: sentenceData.list,
                            wordProgress: wordData.progress,
                            sentenceProgress: sentenceData.progress
                        });
                    }
                }

                setTopics(topicsList);
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
            returnPath: '/learning',
        };
        navigate('/pronunciationPractice', { state: practiceItem });
    };

    const activeTopic = topics.find(t => t.id === activeFilter);
    const isAllWordsDone = activeTopic?.words.length > 0 && activeTopic.words.every(w => w.tryCount > 0);
    const displayItems = activeTopic
        ? (isAllWordsDone ? [...activeTopic.words, ...activeTopic.sentences] : activeTopic.words)
        : [];

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">주제별 학습</h1>

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
                        데이터가 없습니다.
                    </div>
                ) : (
                    displayItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="learning-card"
                            onClick={() => handleItemClick(item)}
                        >
                            <h2 className="learning-text">{item.displayText}</h2>
                            <p className="learning-sub">
                                {item.meaning}
                                {item.korPronunciation && <span className="kor-pron"> {item.korPronunciation}</span>}
                            </p>

                            {/* 완료 뱃지 */}
                            {item.isCompleted && (
                                <div className="completed-badge">
                                    ✅ 완료
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
};

export default LearningPage;