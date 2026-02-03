import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubPage.css';
import './PronunciationPage.css';
import { getCurriculumList } from '../../api/curriculum';

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
                    // 매핑되지 않는 고위 문자는 공백(0x20)이나 물음표(0x3F)로 대체하고 계속 진행
                    // Abort 하지 않음으로써 나머지 문자라도 복구 시도
                    bytes.push(0x20);
                }
            }
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch (e) {
            return str;
        }
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
        localStorage.setItem('lastStudy', JSON.stringify({
            title: '발음기호 학습',
            path: '/pronunciation'
        }));

        const fetchData = async () => {
            try {
                // IPA 타입 데이터 -> 전체 테마에서 조회
                const data = await getCurriculumList('ipa', 'ipa');
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
        navigate('/pronunciationPractice', { state: practiceItem });
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
                            <h2 className="epa-symbol">/{item.ipa}/</h2>
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