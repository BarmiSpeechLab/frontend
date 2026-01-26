import axios from 'axios';

// 백엔드 기본 URL
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 로그인
 * POST /api/users/login
 */
export const login = async (email, password) => {
    console.log(`[API 요청] 로그인 -> 이메일: ${email}`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
            email,
            password
        });
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '로그인 실패');
    }
};

/**
 * 회원가입
 * POST /api/users/signup
 */
export const signup = async (email, password, nickname) => {
    console.log(`[API 요청] 회원가입 -> 이메일: ${email}, 닉네임: ${nickname}`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users/signup`, {
            email,
            password,
            nickname
        });
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '회원가입 실패');
    }
};

/**
 * 로그아웃
 * POST /api/users/logout
 */
export const logout = async () => {
    console.log(`[API 요청] 로그아웃`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users/logout`);
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '로그아웃 실패');
    }
};

/**
 * 회원탈퇴
 * DELETE /api/users
 */
export const withdraw = async () => {
    console.log(`[API 요청] 회원탈퇴`);
    try {
        const response = await axios.delete(`${API_BASE_URL}/users`);
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '회원탈퇴 실패');
    }
};