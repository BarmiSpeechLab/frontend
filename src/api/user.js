
import api from './index';

/**
 * 유저 프로필 조회
 */
export const getUserProfile = async () => {
    console.log('[API 요청] 유저 프로필 조회');
    try {
        const response = await api.get('/users/me');
        console.log('[API 응답 성공]', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 유저 프로필 수정
 * 이미지 업로드를 붙일 경우 FormData + multipart/form-data 헤더 사용
 */
export const updateUserProfile = async (userData) => {
    console.log('[API 요청] 유저 프로필 수정', userData);
    try {
        const response = await api.put('/users/me', userData);
        console.log('[API 응답 성공]', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 유저 학습 통계 조회
 */
export const getUserStats = async () => {
    console.log('[API 요청] 유저 학습 통계 조회');
    try {
        const userId = localStorage.getItem('userId');
        const response = await api.get('/reports/my-stats', { params: { userId } });

        /**
         * [백엔드 수정 후 아래 코드로 변경 필요]
         * userId 파라미터 제거하고 아래와 같이 호출해야 보안상 안전
         */
        // const response = await api.get('/reports/my-stats');

        console.log('[API 응답 성공]', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

// 온보딩 완료 처리
export const completeOnboarding = async () => {
    console.log('[API 요청] 온보딩 완료 처리');
    try {
        const response = await api.put('/users/tutorial');
        console.log('[API 응답 성공]', response.data.data);
        return response.data.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 월별 학습 캘린더 로그 조회
 */
export const getCalendarLogs = async (year, month) => {
    console.log(`[API 요청] 캘린더 로그 조회: ${year}-${month}`);
    try {
        const response = await api.get(`/reports/calendar/${year}/${month}`);
        console.log('[API 응답 성공]', response.data.data);
        return response.data.data || [];
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 발음 취약점 레이더 차트 데이터 조회
 */
export const getIpaRadarStats = async () => {
    console.log('[API 요청] 레이더 차트 데이터 조회');
    try {
        const response = await api.get('/reports/radar-chart');
        console.log('[API 응답 성공]', response.data.data);
        return response.data.data || {};
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};
