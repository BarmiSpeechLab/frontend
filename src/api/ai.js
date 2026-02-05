import api from './index';

/**
 * 발음 평가 제출
 */
export const submitPronunciation = async (file, curriculumId) => {
    console.log('[API 요청] 발음 평가 제출');

    try {
        const formData = new FormData();

        // ✅ 백엔드가 받는 키 이름이 반드시 "file"
        // file이 Blob이면 파일명까지 주는 게 안전함
        formData.append('file', file, file?.name ?? 'audio.webm');

        // ✅ @RequestParam curriculumId 필수
        formData.append('curriculumId', String(curriculumId));

        // ✅ 헤더 지정 제거 (axios가 boundary 포함해서 자동 설정)
        const response = await api.post('/analysis/submit', formData);

        const rawData = response.data;
        let taskId = rawData;

        if (typeof rawData === 'string' && rawData.includes('저장 성공: ')) {
            taskId = rawData.replace('저장 성공: ', '').trim();
        } else if (rawData && rawData.data) {
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
 * 백엔드가 깔끔한 JSON 객체로 응답하므로 파싱 로직 단순화
 */
export const checkAnalysisStatus = async (curriculumId, taskId) => {
    try {
        const response = await api.get(`/analysis/${curriculumId}/${taskId}`);
        const result = response.data;

        console.log('[폴링 응답] result:', result);

        // 백엔드가 IntegratedAnalysisResult 객체를 JSON으로 직렬화하여 반환
        // status 필드로 처리 상태 확인
        if (result.status === 'PROCESSING') {
            return { status: 'PROCESSING', result: result };
        }

        if (result.status === 'SUCCESS' || result.status === 'COMPLETED') {
            // 결과 데이터가 있는지 확인
            const hasData = result.pronunciation || result.intonations || result.llmFeedback;
            if (hasData) {
                return { status: 'COMPLETED', result: result };
            }
        }

        if (result.status === 'ERROR') {
            return { status: 'ERROR', error: result };
        }

        // 기본값: 아직 처리 중
        return { status: 'PROCESSING', result: null };
    } catch (error) {
        console.error('분석 상태 확인 실패:', error);
        return { status: 'ERROR', error };
    }
};
