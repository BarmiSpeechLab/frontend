import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubPage.css';
import './PronunciationPage.css';
import { getCurriculumList, getCurriculumDetail } from '../../api/curriculum';

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

        // ✅ 데이터 페칭 with Session Storage 캐싱
        const fetchData = async () => {
            try {
                // 캐시 확인 (5분간 유효)
                const cached = sessionStorage.getItem('pronunciation_data');
                if (cached) {
                    try {
                        const { data, timestamp } = JSON.parse(cached);
                        const cacheAge = Date.now() - timestamp;
                        const CACHE_DURATION = 5 * 60 * 1000;  // 5분

                        if (cacheAge < CACHE_DURATION) {
                            console.log('[Cache Hit] Session Storage에서 발음기호 로드 (캐시 나이:', Math.round(cacheAge / 1000), '초)');
                            setIpaItems(data);
                            setLoading(false);
                            return;
                        } else {
                            console.log('[Cache Expired] 캐시 만료, API 재조회');
                        }
                    } catch (e) {
                        console.warn('캐시 데이터 파싱 실패:', e);
                    }
                }

                console.log('[Fetching] 발음기호 데이터 조회 시작 (39개 API 호출)');

                // 500 에러 회피: 'ipa' 문자열 검색 대신 ID 1~40번 직접 조회
                const ids = Array.from({ length: 40 }, (_, i) => i + 1).filter(id => id !== 8);
                const promises = ids.map(id => getCurriculumDetail(id).catch(() => null));
                const results = await Promise.all(promises);
                const data = results.filter(item => item !== null);

                const formattedData = (data || []).map(item => {
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

                console.log('[Fetching] 발음기호 데이터 조회 완료');

                // ✅ Session Storage에 캐싱
                sessionStorage.setItem('pronunciation_data', JSON.stringify({
                    data: formattedData,
                    timestamp: Date.now()
                }));

                setIpaItems(formattedData);
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
        <div className="subpage-container">
            <h1 className="subpage-title">발음기호 학습</h1>

            <div className="tabs">
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

            <div className="card-grid col-3" style={{ gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>로딩 중...</div>
                ) : currentList.length > 0 ? (
                    currentList.map((item, idx) => (
                        <div
                            key={idx}
                            className="epa-card"
                            onClick={() => handleCardClick(item)}
                        >
                            <h2 className="epa-symbol">{item.ipa ? item.ipa.replace(/[\/\[\]]/g, '') : ''}</h2>
                            <p className="epa-word">{item.displayText} <span className="epa-kor">{item.korPronunciation}</span></p>

                            <div className="epa-progress-bg">
                                <div
                                    className="epa-progress-fill"
                                    style={{ width: `${item.tryCount > 0 ? 100 : 0}%` }}
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