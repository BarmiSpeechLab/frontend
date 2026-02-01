import api from './index';

/**
 * 로그인
 */
export const login = async (email, password) => {
    console.log(`[API 요청] 로그인 -> 이메일: ${email}`);
    try {
        const response = await api.post('/users/login', {
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
 */
export const signup = async (email, password, nickname, role) => {
    console.log(`[API 요청] 회원가입 -> 이메일: ${email}, 닉네임: ${nickname}`);
    try {
        const response = await api.post('/users/signup', {
            email,
            password,
            nickname,
            role
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
 */
export const logout = async () => {
    console.log(`[API 요청] 로그아웃`);
    try {
        const response = await api.post('/users/logout');
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '로그아웃 실패');
    }
};

// 회원탈퇴
export const withdraw = async () => {
    console.log(`[API 요청] 회원탈퇴`);
    try {
        const response = await api.delete('/users');
        console.log('[API 응답 성공]', response.data);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[API 응답 실패]', errorData || error.message);
        throw new Error(errorData?.error?.message || error.message || '회원탈퇴 실패');
    }
};