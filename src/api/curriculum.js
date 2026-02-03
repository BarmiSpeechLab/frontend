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
        console.log(`[API 요청] 상세 조회: ${url}`);
        const response = await api.get(url);
        console.log(`[API 응답 성공] ID ${curriculumId}:`, response.data.data);
        return response.data.data;
    } catch (error) {
        console.error(`커리큘럼 상세 조회 실패 (ID: ${curriculumId}):`, error);
        throw error;
    }
};