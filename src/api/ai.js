import api from './index';

/**
 * 발음 평가 제출
 */
export const submitPronunciation = async (formData) => {
    console.log('[API 요청] 발음 평가 제출');
    try {
        const response = await api.post('/feedback/submit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const rawData = response.data;
        let taskId = rawData;

        // 1. "저장 성공: REQ_..." 형식 파싱
        if (typeof rawData === 'string' && rawData.includes('저장 성공: ')) {
            taskId = rawData.replace('저장 성공: ', '').trim();
        }
        // 2.ApiResponse {data}
        else if (rawData && rawData.data) {
            taskId = rawData.data;
        }

        console.log('[API 성공] Task ID 수신:', taskId);
        return { taskId };
    } catch (error) {
        console.error('[API 실패] 제출 에러:', error);
        throw error;
    }
};

/**
 * 분석 상태 확인 -> 폴링
 */
export const checkAnalysisStatus = async (taskId) => {
    try {
        const response = await api.get(`/feedback/${taskId}`);
        const rawData = response.data;

        console.log('[폴링 응답] rawData:', rawData);

        // 1. 데이터 추출 (ApiResponse or 직접 데이터)
        let content = (rawData && rawData.data !== undefined ? rawData.data : rawData);

        // 2. 진행 상태 체크
        if (!content || content === '분석 진행 중' || content === '저장 성공: null' || content === 'null') {
            return { status: 'PROCESSING', result: null };
        }

        // 3. 완료된 객체인 경우 (JSON)
        if (typeof content === 'object') {
            const hasData = content.pronunciation || content.intonations || content.llmFeedback;
            if (hasData) {
                return { status: 'COMPLETED', result: content };
            }
        }

        // 4. 레거시 문자열 파싱 (Java toString() 대응)
        if (typeof content === 'string' && content.includes('IntegratedAnalysisResult')) {
            const parsed = parseJavaToString(content);
            if (parsed) {
                // 발음/억양/피드백 중 하나라도 있으면 완료로 간주 (백엔드 사양에 따라)
                const hasData = parsed.pronunciation || parsed.intonations || parsed.llmFeedback;
                if (hasData) {
                    return { status: 'COMPLETED', result: parsed };
                }
            }
        }

        return { status: 'PROCESSING', result: null };
    } catch (error) {
        console.error('[AI API] 조회 실패:', error);
        return { status: 'PROCESSING', result: null };
    }
};

// 백엔드에서 온 객체 프론트용으로 변환
const formatResult = (raw) => {
    // 발음 결과 추출
    const pron = raw.pronunciation || {};

    // UI에 필요한 기본 구조 생성
    return {
        grade: pron.grade || 'GOOD',
        feedback: raw.llmFeedback?.recommendation || '전반적으로 훌륭한 발음입니다.',
        // 그래프 데이터 (없으면 더미)
        standardPitch: raw.intonations?.standard || [20, 40, 60, 40, 20],
        userPitch: raw.intonations?.user || [22, 38, 55, 42, 25],
        // 상세 발음 데이터
        wordSegments: pron.segments || [
            {
                word: 'Result',
                isCorrect: true,
                phonemes: []
            }
        ],
        userAudioUrl: raw.userAudioUrl // 필요 시
    };
};

//Java의 toString() 결과물 파싱 도구
// ex)IntegratedAnalysisResult(taskId=..., pronunciation={score=90, ...})

const parseJavaToString = (str) => {
    try {
        const result = {
            taskId: null,
            pronunciation: null,
            intonations: null,
            llmFeedback: null
        };

        const contentMatch = str.match(/\((.*)\)/);
        if (!contentMatch) return null;
        const content = contentMatch[1];

        // 정규식으로 key=value 쌍 추출 (중첩된 {} 나 [] 고려)
        const regex = /([a-zA-Z]+)=({.*?}|\[.*?\]|[^,]*)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const key = match[1];
            let value = match[2];

            if (value === 'null') {
                result[key] = null;
            } else if (value.startsWith('{')) {
                // 맵 파싱
                const mapObj = {};
                const mapContent = value.substring(1, value.length - 1);
                mapContent.split(', ').forEach(pair => {
                    const [mk, mv] = pair.split('=');
                    if (mk) mapObj[mk] = mv;
                });
                result[key] = mapObj;
            } else {
                result[key] = value;
            }
        }
        return result;
    } catch (e) {
        console.error('Java String 파싱 에러:', e);
        return null;
    }
};

/**
 * 서버 응답 없을 경우 -> 더미 결과로
 */
export const getLocalMockResult = (item, userAudioUrl) => {
    return {
        item,
        userAudioUrl,
        grade: 'EXCELLENT',
        feedback: '좋습니다.',
        standardPitch: [10, 30, 60, 80, 60, 30, 10],
        userPitch: [12, 28, 55, 75, 45, 35, 8],
        wordSegments: [
            {
                word: item.word || item.text || 'Practice',
                isCorrect: true,
                phonemes: []
            }
        ]
    };
};

export const resetAnalysisMock = () => {
};