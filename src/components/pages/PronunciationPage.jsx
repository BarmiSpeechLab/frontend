import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SubPage.css';
import './PronunciationPage.css';
import { getCurriculumList, getCurriculumDetail, getUserCurriculumStats } from '../../api/curriculum';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import stamp from '../../assets/img/stamp.png';

const PronunciationPage = () => {
    // IPA 타입 매핑
    const TYPE_MAPPING = {
        'vowel': '모음',
        'stop': '파열음',
        'affricate': '파찰음',
        'fricative': '마찰음',
        'aspirate': '기식음',
        'liquid': '유음',
        'nasal': '비음',
        'semivowel': '반모음'
    };

    const TABS = ['모음', '파열음', '마찰음', '파찰음', '비음', '유음', '기식음', '반모음'];

    const [activeTab, setActiveTab] = useState('모음');
    const [ipaItems, setIpaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation(); // ✅ location 변경 감지
    // Pass dependency to re-run observer when loading finishes or tab changes
    const containerRef = useScrollAnimation([loading]);

    // curr.sql <- SET NAMES utf8mb4; 한 줄 넣어주니 변환 필요 X
    const fixEncoding = (str) => {
        return str;
    };

    // meaning에서 타입 추출 (예: "AA (vowel)" -> "모음")
    const getKorType = (meaning) => {
        if (!meaning) return '기타';
        const match = meaning.match(/\((.*?)\)/);
        if (match && match[1]) {
            const engType = match[1].toLowerCase();
            return TYPE_MAPPING[engType] || '기타';
        }
        return '기타';
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
        localStorage.setItem('lastStudy', JSON.stringify({
            title: '발음기호 학습',
            path: '/pronunciation'
        }));

        // ✅ API 분리: 커리큘럼(정적) + Stats(동적)
        const fetchData = async () => {
            try {
                // =======================================================
                // 1단계: 커리큘럼 정보 조회 (정적, 캐싱)
                // =======================================================
                let formattedData;
                const cached = sessionStorage.getItem('pronunciation_data');

                if (cached) {
                    try {
                        const { data, timestamp } = JSON.parse(cached);
                        const cacheAge = Date.now() - timestamp;
                        const CACHE_DURATION = 24 * 60 * 60 * 1000;  // 1일

                        if (cacheAge < CACHE_DURATION) {
                            console.log('[Static Cache Hit] 발음기호 정보 로드 (캐시 나이:', Math.round(cacheAge / 3600000), '시간)');
                            formattedData = data;
                        } else {
                            console.log('[Static Cache Expired] 캐시 만료, API 재조회');
                        }
                    } catch (e) {
                        console.warn('캐시 데이터 파싱 실패:', e);
                    }
                }

                // 캐시가 없으면 API 호출
                if (!formattedData) {
                    console.log('[Fetching Static] 발음기호 데이터 조회 시작 (39개 API 호출)');

                    // 500 에러 회피: 'ipa' 문자열 검색 대신 ID 1~40번 직접 조회
                    const ids = Array.from({ length: 40 }, (_, i) => i + 1).filter(id => id !== 8);
                    const promises = ids.map(id => getCurriculumDetail(id).catch(() => null));
                    const results = await Promise.all(promises);
                    const data = results.filter(item => item !== null);

                    formattedData = (data || []).map(item => {
                        const parsed = parseText(item.text); // word와 examples 추출
                        return {
                            ...item,
                            displayText: parsed.word,
                            examples: parsed.examples.map(ex => ({
                                ex_text: fixEncoding(ex.ex_text),
                                ex_mean: fixEncoding(ex.ex_mean)
                            })),
                            korPronunciation: fixEncoding(item.korPronunciation),
                            meaning: fixEncoding(item.meaning),
                            ipa: fixEncoding(item.ipa),
                            korType: getKorType(fixEncoding(item.meaning))
                        };
                    });

                    console.log('[Fetching Static] 발음기호 데이터 조회 완료');

                    // ✅ Session Storage에 캐싱 (정적 데이터)
                    sessionStorage.setItem('pronunciation_data', JSON.stringify({
                        data: formattedData,
                        timestamp: Date.now()
                    }));
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
                const mergedData = formattedData.map(item => {
                    const stat = statsMap.get(item.id) || { score: 0, tryCount: 0, grade: null };
                    return {
                        ...item,
                        score: stat.score,
                        tryCount: stat.tryCount,
                        grade: stat.grade,
                        isCompleted: stat.tryCount > 0
                    };
                });

                console.log('[Merge Complete] 발음기호 + Stats 병합 완료');
                setIpaItems(mergedData);
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location.pathname]); // ✅ location 변경 시 재실행 (Stats만 다시 조회)

    const handleCardClick = (item) => {
        const practiceItem = {
            ...item,
            symbol: item.ipa,
            word: item.displayText,
            pronunciation: item.ipa,
            examples: item.examples // 실습 페이지로 예시 전달
        };
        navigate('/pronunciationPractice?mode=PRON', { state: practiceItem });
    };

    // 탭 필터링
    const currentList = ipaItems.filter(item => item.korType === activeTab);

    return (
        <div className="subpage-container" ref={containerRef}>
            <h1 className="subpage-title anim-target delay-1">발음기호 학습</h1>

            <div className="tabs anim-target delay-2">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="card-grid col-3 anim-target delay-3" style={{ gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>로딩 중...</div>
                ) : currentList.length > 0 ? (
                    currentList.map((item, idx) => (
                        <div
                            key={idx}
                            className="epa-card"
                            onClick={() => handleCardClick(item)}
                        >
                            {item.isCompleted && (
                                <div className="completed-stamp">
                                    <img src={stamp} alt="완료" />
                                </div>
                            )}
                            <h2 className="epa-symbol">{item.ipa ? item.ipa.replace(/[\/\[\]]/g, '') : ''}</h2>
                            <p className="epa-word">{item.displayText} <span className="epa-kor">{item.korPronunciation}</span></p>

                            {item.tryCount > 0 && (
                                <div className="stats-above-progress">
                                    <span className="stat-badge-left">{item.tryCount}회</span>
                                    <span className="stat-badge-right">{item.score}점</span>
                                </div>
                            )}

                            <div className="epa-progress-bg">
                                <div
                                    className="epa-progress-fill"
                                    style={{
                                        width: `${item.tryCount > 0 ? 100 : 0}%`,
                                        background: item.tryCount > 0 ? '#4CAF50' : '#a67c00'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                        데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PronunciationPage;