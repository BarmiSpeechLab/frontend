import api from './index';

/**
 * 대화 분석 제출
 */
export const submitConversation = async (file, curriculumId, prevTurn, theme) => {
    console.log('[API 요청] 대화 분석 제출');

    try {
        const formData = new FormData();

        // 파일 추가
        formData.append('file', file, file?.name ?? 'conversation.webm');

        // 파라미터 추가
        formData.append('curriculumId', String(curriculumId));
        formData.append('prevTurn', prevTurn);
        formData.append('theme', theme);

        const response = await api.post('/conversation/submit', formData);

        const rawData = response.data;
        let taskId = rawData;

        // "대화 분석 요청 성공: CONV_xxx" 형식에서 taskId 추출
        if (typeof rawData === 'string' && rawData.includes('대화 분석 요청 성공: ')) {
            taskId = rawData.replace('대화 분석 요청 성공: ', '').trim();
        } else if (rawData && rawData.data) {
            taskId = rawData.data;
        }

        console.log('[API 성공] Conversation Task ID 수신:', taskId);
        return { taskId };
    } catch (error) {
        console.error('[API 실패] 대화 분석 제출 에러:', error);
        throw error;
    }
};

/**
 * 대화 분석 상태 확인 -> 폴링
 */
export const checkConversationStatus = async (taskId) => {
    try {
        const response = await api.get(`/conversation/${taskId}`);
        const result = response.data;

        console.log('[대화 폴링 응답] result:', result);

        // status 필드로 처리 상태 확인
        if (result.status === 'PROCESSING') {
            return { status: 'PROCESSING', result: null };
        }

        if (result.status === 'SUCCESS' || result.status === 'COMPLETED') {
            // analysisResult 필드에 대화 분석 결과가 있음
            if (result.analysisResult) {
                return {
                    status: 'COMPLETED',
                    result: result.analysisResult  // transScript, nextTurn, theme, feedback 포함
                };
            }
        }

        if (result.status === 'ERROR') {
            return { status: 'ERROR', error: result };
        }

        // 기본값: 아직 처리 중
        return { status: 'PROCESSING', result: null };
    } catch (error) {
        console.error('대화 분석 상태 확인 실패:', error);
        return { status: 'ERROR', error };
    }
};
