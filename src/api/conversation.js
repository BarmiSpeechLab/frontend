import api from './index';

/**
 * 1. 대화 시작 (주제 선택 시 첫 질문 요청)
 * Mock: 테마에 따른 첫 질문 반환
 */
export const startConversation = async (theme) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let firstQuestion = "";

            switch (theme) {
                case 'DAILY': firstQuestion = "Hello! How are you feeling today?"; break;
                case 'TRAVEL': firstQuestion = "Where is the best place you have ever visited?"; break;
                case 'FOOD': firstQuestion = "What is your favorite Korean food?"; break;
                case 'SHOPPING': firstQuestion = "Do you prefer shopping online or in-store?"; break;
                case 'BUSINESS': firstQuestion = "Can you introduce yourself briefly?"; break;
                default: firstQuestion = "Let's start the conversation. Say hello!";
            }

            console.log(`[API] 대화 시작 (테마: ${theme}, 질문: ${firstQuestion})`);
            resolve({
                type: "conversation",
                message: firstQuestion
            });
        }, 300);
    });
};

/**
 * 2. 대화 음성 파일 제출 및 분석 요청
 * POST /api/conversation/submit
 */
export const submitConversation = async (audioBlob, prevTurn, theme) => {
    console.log('[API 요청] 대화 분석 제출');

    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'conversation.webm');
        formData.append('prevTurn', prevTurn || '');
        formData.append('theme', theme);

        const response = await api.post('/conversation/submit', formData);

        // 백엔드 응답: "대화 분석 요청 성공: CONV_xxx"
        const message = response.data;
        let taskId = message;

        if (typeof message === 'string' && message.includes('성공: ')) {
            taskId = message.split('성공: ')[1].trim();
        }

        console.log('[API 응답] TaskID:', taskId);
        return { taskId };

    } catch (error) {
        console.error('[API 에러] 대화 분석 제출 실패:', error);
        throw error;
    }
};

/**
 * 3. 대화 분석 결과 조회 (Polling)
 * GET /api/conversation/{taskId}
 */
export const checkConversationStatus = async (taskId) => {
    try {
        const response = await api.get(`/conversation/${taskId}`);
        const result = response.data;

        console.log('[API 응답] 대화 분석 상태:', result.status);

        // 응답 구조:
        // {
        //   taskId: "CONV_xxx",
        //   status: "PROCESSING" | "SUCCESS" | "ERROR",
        //   analysisResult: {
        //     transScript: "...",
        //     nextTurn: "...",
        //     theme: "DAILY",
        //     feedback: "..."
        //   }
        // }

        return result;

    } catch (error) {
        console.error('[API 에러] 대화 분석 상태 조회 실패:', error);
        throw error;
    }
};
