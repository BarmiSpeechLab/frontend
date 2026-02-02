import api from './index';

/**
 * 커리큘럼 목록 가져오기
 * @param {string} type - 학습 타입 (단어 / 문장)
 * @param {string} theme - 학습 주제
 * @returns {Promise<Array>} 학습 데이터 배열
 */
export const getCurriculumList = async (type, theme) => {
    try {
        const response = await api.get(`/curriculums/${encodeURIComponent(type)}/${encodeURIComponent(theme)}`);
        return response.data.data;
    } catch (error) {
        console.error('커리큘럼 로딩 실패:', error);
        throw error;
    }
};
