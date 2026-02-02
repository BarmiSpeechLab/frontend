import axios from 'axios';

// 1. 백엔드 주소 (로컬 개발용)
const BACKEND_URL = 'http://localhost:8080/';
// const BACKEND_URL = '/';

/**
 * 2. 세션(방) 생성 함수
 * @param {string} sessionId - 생성할 세션의 ID(이름)
 * @returns {Promise<string>} - 생성된 세션 정보
 */
export const createSession = async (sessionId) => {
    try {
        // 백엔드에 세션 생성 요청
        const response = await axios.post(`${BACKEND_URL}api/meetings/sessions`, { 
            customSessionId: sessionId,
        });

        // 성공 시 세션 ID 반환
        return response.data.data.sessionId; // 백엔드 응답 구조에 따라 .data.sessionId 또는 .sessionId
    } catch (error) {
        // 방이 이미 존재하는 경우 세션 ID를 그대로 사용
        if (error.response && error.response.status === 409) {
            return sessionId;
        }
        console.error("방 생성 실패:", error);
        throw error;
    }
};

/**
 * 3. 토큰 발급 함수
 * @param {string} sessionId - 입장할 방 ID
 * @returns {Promise<string>} - 암호화된 입장 토큰
 */
export const createToken = async (sessionId) => {
    try {
        // 백엔드에 토큰 발급 요청
        const response = await axios.post(`${BACKEND_URL}api/meetings/sessions/${sessionId}/connections`, {});

        // 성공 시 토큰 반환
        return response.data.data.token;
    } catch (error) {
        console.error("토큰 발급 실패:", error);
        throw error;
    }
};
