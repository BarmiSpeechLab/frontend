import api from './index';

/**
 * 커리큘럼 목록 가져오기
 * @param {string} type - 학습 타입 (단어 / 문장)
 * @param {string} theme - 학습 주제
 * @returns {Promise<Array>} 학습 데이터 배열
 */
export const getCurriculumList = async (type, theme) => {
    try {
        const url = `/curriculums/${encodeURIComponent(type)}/${encodeURIComponent(theme)}`;
        console.log(`[API 요청] URL: ${url} (type: ${type}, theme: ${theme})`);
        const response = await api.get(url);
        console.log('[API 응답 성공]', response.data.data);

        return response.data.data;
    } catch (error) {
        console.error('커리큘럼 로딩 실패:', error);
        console.error('에러:', error.response);
        throw error;
    }
};

export const getCurriculumDetail = async (curriculumId) => {
    try {
        const url = `/curriculums/${curriculumId}`;
        const response = await api.get(url);
        return response.data.data;
    } catch (error) {
        // 404 에러는 데이터가 없는 것이므로 조용히 null 반환
        if (error.response?.status === 404) {
            return null;
        }
        // 다른 에러는 로깅
        console.error(`커리큘럼 상세 조회 실패 (ID: ${curriculumId}):`, error);
        return null;
    }
};

// ✅ NEW: 사용자별 커리큘럼 통계만 조회 (동적 데이터, 경량)
export const getUserCurriculumStats = async () => {
    const response = await api.get('/curriculums/stats');
    return response.data.data; // [{curriculumId, score, tryCount, grade, ...}]
};

// ✅ NEW: 커리큘럼 정보만 조회 (정적 데이터, Stats 없음)
export const getCurriculumListStatic = async (type, theme) => {
    const url = `/curriculums/static/${encodeURIComponent(type)}/${encodeURIComponent(theme)}`;
    try {
        const response = await api.get(url);
        console.log(`[API] getCurriculumListStatic(${type}, ${theme}) Response:`, response.data);
        return response.data.data;
    } catch (error) {
        console.error(`[API Error] getCurriculumListStatic(${type}, ${theme}) 실패:`, error);
        throw error;
    }
};
