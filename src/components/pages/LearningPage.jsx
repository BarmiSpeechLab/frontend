import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurriculumList } from '../../api/curriculum';
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

    useEffect(() => {
        // 데이터 페칭
        const fetchData = async () => {
            try {
                // 각 주제별로 단어랑 문장 데이터 가져와서 합치기
                const themes = ['daily', 'travel', 'food', 'shopping', 'business'];
                const topicsList = [];

                for (const theme of themes) {
                    try {
                        const [wordsData, sentencesData] = await Promise.all([
                            getCurriculumList('단어', theme).catch(() => []),
                            getCurriculumList('문장', theme).catch(() => [])
                        ]);

                        if (wordsData.length > 0 || sentencesData.length > 0) {
                            const topic = {
                                id: theme,
                                title: THEME_LABELS[theme] || theme,
                                subTitle: `${THEME_LABELS[theme] || theme} 관련 표현 학습`,
                                words: wordsData.map(w => ({ ...w, itemType: 'word' })),
                                sentences: sentencesData.map(s => ({ ...s, itemType: 'sentence' }))
                            };
                            topicsList.push(topic);
                        }
                    } catch (error) {
                        console.warn(`${theme} 주제 로드 실패:`, error);
                    }
                }
                setTopics(topicsList);
            } catch (error) {
                console.error('학습 목록 로드 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleItemClick = (item) => {
        // 현재 선택한 아이템이 속한 토픽 찾기
        const topic = topics.find(t => t.id === activeFilter);

        // 단어면 다음 단계로 문장, 문장이면 학습 끝
        let nextItem = null;
        if (item.itemType === 'word' && topic && topic.sentences.length > 0) {
            // 해당 단어의 인덱스 찾아서 같은 인덱스 문장으로 연결
            const wordIdx = topic.words.findIndex(w => w.id === item.id);
            if (wordIdx !== -1 && topic.sentences[wordIdx]) {
                nextItem = topic.sentences[wordIdx];
            } else {
                nextItem = topic.sentences[0]; // 매칭되는 인덱스 없으면 첫 번째 문장으로 돌아가기
            }
        }

        const practiceItem = {
            ...item,
            symbol: item.text,
            word: item.text,
            meaning: item.meaning,
            itemType: item.itemType,
            ipa: item.ipa,
            korPronunciation: item.korPronunciation,
            returnPath: '/learning',
            nextItem: nextItem ? {
                ...nextItem,
                symbol: nextItem.text,
                word: nextItem.text,
                meaning: nextItem.meaning,
                itemType: nextItem.itemType,
                ipa: nextItem.ipa,
                korPronunciation: nextItem.korPronunciation,
                returnPath: '/learning'
            } : null
        };
        navigate('/pronunciationPractice', { state: practiceItem });
    };

    // 현재 탭에 해당하는 토픽 가져오기
    const activeTopic = topics.find(t => t.id === activeFilter);

    // 단어 학습 완료 여부 체크 (모든 단어의 tryCount > 0 인지)
    const isAllWordsDone = activeTopic?.words.length > 0 && activeTopic.words.every(w => w.tryCount > 0);

    // 단어만 보여주거나, 모든 단어 학습 완료했으면 문장까지 결합해서 보여주기
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
                            <h2 className="learning-text">{item.text}</h2>
                            <p className="learning-sub">
                                {item.meaning}
                                {item.korPronunciation && <span className="kor-pron"> {item.korPronunciation}</span>}
                            </p>
                            <div className="learning-progress-bg">
                                <div
                                    className="learning-progress-fill"
                                    style={{ width: item.tryCount > 0 ? '100%' : '0%' }}
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
