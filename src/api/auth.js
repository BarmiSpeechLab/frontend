import axios from 'axios';

// 백엔드 기본 URL
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 로그인
 * POST /api/users/login
 */
export const login = async (email, password) => {
    console.log(`로그인 요청: ${email}`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
            email,
            password
        });
        // 토큰 반환값 처리
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || '로그인 실패');
    }
};

/**
 * 회원가입
 * POST /api/users
 */
export const signup = async (email, password) => {
    console.log(`회원가입 요청: ${email}`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users`, {
            email,
            password
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || '회원가입 실패');
    }
};

/**
 * 로그아웃
 * POST /api/users/logout
 */
export const logout = async () => {
    console.log(`로그아웃 요청`);
    try {
        const response = await axios.post(`${API_BASE_URL}/users/logout`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || '로그아웃 실패');
    }
};

/**
 * 회원탈퇴
 * DELETE /api/users
 */
export const withdraw = async () => {
    console.log(`회원탈퇴 요청`);
    try {
        const response = await axios.delete(`${API_BASE_URL}/users`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || '회원탈퇴 실패');
    }
};