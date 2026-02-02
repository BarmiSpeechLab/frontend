import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubPage.css';
import './PronunciationPage.css';
import { getCurriculumList } from '../../api/curriculum';

const PronunciationPage = () => {
    const [activeTab, setActiveTab] = useState('vowels');
    const [ipaItems, setIpaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('lastStudy', JSON.stringify({
            title: '발음기호 학습',
            path: '/pronunciation'
        }));

        const fetchData = async () => {
            try {
                // IPA 타입 데이터 -> 전체 테마에서 조회
                const data = await getCurriculumList('IPA', 'IPA');
                setIpaItems(data || []);
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
            symbol: item.ipa, // 백엔드 ipa 필드가 기호 (ɑ)
            word: item.text,  // 백엔드 text 필드가 대표 단어 (car)
            pronunciation: item.ipa,
        };
        navigate('/pronunciationPractice', { state: practiceItem });
    };

    // 모음/자음 탭 필터링
    const currentList = ipaItems.filter(item => {
        const meaning = (item.meaning || '').toLowerCase();
        if (activeTab === 'vowels') return meaning.includes('vowel');
        if (activeTab === 'consonants') return meaning.includes('consonant');
        return true;
    });

    return (
        <div className="subpage-container">
            <h1 className="subpage-title">발음기호 학습</h1>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'vowels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vowels')}
                >
                    모음
                </button>
                <button
                    className={`tab-btn ${activeTab === 'consonants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consonants')}
                >
                    자음
                </button>
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
                            <p className="epa-word">{item.text} <span className="epa-kor">{item.korPronunciation}</span></p>

                            <div className="epa-progress-bg">
                                <div
                                    className="epa-progress-fill"
                                    style={{ width: `${item.tryCount > 0 ? 100 : 0}%` }} // 완료 여부 임시 표시
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