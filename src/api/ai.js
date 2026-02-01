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

        // "저장 성공: REQ_..." 형식 파싱
        if (typeof rawData === 'string' && rawData.includes('저장 성공: ')) {
            taskId = rawData.replace('저장 성공: ', '').trim();
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

        console.log('[폴링 응답] rawData:', rawData, 'type:', typeof rawData);

        // 진행 상태 체크
        if (!rawData || rawData === '분석 진행 중' || rawData === '저장 성공: null' || rawData === 'null') {
            return { status: 'PROCESSING', result: null };
        }

        // 결과 파싱 (String 또는 JSON)
        if (typeof rawData === 'string' && rawData.includes('저장 성공: ')) {
            const content = rawData.replace('저장 성공: ', '').trim();

            // Java toString() 형식 파싱 시도
            if (content.includes('IntegratedAnalysisResult')) {
                const result = parseJavaToString(content);
                if (result) return { status: 'COMPLETED', result: { ...result, taskId } };
            }

            // 일반 JSON 파싱 시도
            try {
                const parsed = JSON.parse(content);
                return { status: 'COMPLETED', result: { ...parsed, taskId } };
            } catch (e) { }
        }

        // 객체로 온 경우
        if (typeof rawData === 'object' && rawData.taskId) {
            return { status: 'COMPLETED', result: rawData };
        }

        return { status: 'PROCESSING', result: null };
    } catch (error) {
        console.error('[AI API] 조회 실패:', error);
        return { status: 'PROCESSING', result: null };
    }
};

/**
 * 필수 데이터만 추출
 */
const parseJavaToString = (str) => {
    try {
        const extractValue = (key) => {
            const regex = new RegExp(`${key}=([^,)]+)`, 'i');
            const match = str.match(regex);
            return match ? match[1].trim() : null;
        };

        const grade = extractValue('grade');
        if (!grade) return null;

        return {
            grade,
            feedback: '분석이 완료되었습니다.',
            standardPitch: [20, 40, 60, 40, 20],
            userPitch: [25, 45, 55, 35, 25],
            wordSegments: []
        };
    } catch (e) { return null; }
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
    // 분석 상태 초기화 필요 있을 때 사용 -> 지금은 기능 X
};