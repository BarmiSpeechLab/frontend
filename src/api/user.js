import { jwtDecode } from "jwt-decode";
import api from './index';

/**
 * 프로필 조회
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
 * 프로필 수정
 * 연동 시 데이터 -> FormData로 보낼 경우(프로필 이미지 수정 추가될 경우) api.put의 두 번째 인자로 formData,
 * 세 번째 인자로 { headers: { 'Content-Type': 'multipart/form-data' } }를 추가
 * 이미지 수정 안 넣을거면 필요 X
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

// 학습 현황 조회
export const getUserStats = async () => {
    console.log('[API 요청] 유저 학습 현황 조회');
    try {
        const response = await api.get('/report/my-stats');
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