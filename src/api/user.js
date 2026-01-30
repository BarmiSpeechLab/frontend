import { jwtDecode } from "jwt-decode";
import api from './index';

/**
 * 프로필 조회
 */
export const getUserProfile = async () => {
    // [실제 API 연동 코드 - 나중에 주석 해제해서 사용]
    /*
    console.log('[API 요청] 유저 프로필 조회');
    try {
        const response = await api.get('/users/me');
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
    */

    // [현재 사용 중: 더미 데이터 (Mock) - 토큰 기반 지능형 반환]
    console.log('[API 요청] 유저 프로필 조회 (Mock)');
    return new Promise((resolve) => {
        setTimeout(() => {
            let realRole = 'USER';
            const token = localStorage.getItem('accessToken');

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    // 토큰에 있는 auth 정보(예: "ROLE_TUTOR")를 확인
                    if (decoded.auth && decoded.auth.includes('TUTOR')) {
                        realRole = 'TUTOR';
                    }
                    console.log(`[Mock] 토큰 해독 결과 Role: ${realRole}`);
                } catch (e) {
                    console.error('[Mock] 토큰 해독 실패:', e);
                }
            }

            resolve({
                id: 1,
                email: localStorage.getItem('userEmail') || 'test@example.com',
                nickname: '바르미',
                role: realRole,
                profileImage: null
            });
        }, 300);
    });
};

/**
 * 프로필 수정
 * 연동 시 데이터 -> FormData로 보낼 경우(프로필 이미지 수정 추가될 경우) api.put의 두 번째 인자로 formData,
 * 세 번째 인자로 { headers: { 'Content-Type': 'multipart/form-data' } }를 추가
 * 이미지 수정 안 넣을거면 필요 X
 */
export const updateUserProfile = async (userData) => {
    console.log('[API 요청] 유저 프로필 수정', userData);
    try {
        const response = await api.put('/users/me', userData);
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 학습 현황 조회
 */
export const getUserStats = async () => {
    console.log('[API 요청] 유저 학습 현황 조회');
    try {
        const response = await api.get('/report/my-stats');
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};

/**
 * 온보딩 완료 처리
 */
export const completeOnboarding = async () => {
    console.log('[API 요청] 온보딩 완료 처리');
    try {
        const response = await api.put('/users/onboarding');
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        console.error('[API 응답 실패]', error);
        throw error;
    }
};