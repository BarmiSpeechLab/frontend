import axios from 'axios';

// 백엔드 기본 URL 설정
const API_BASE_URL = '/api';


// 공통 Axios 인스턴스 생성 -> 한 번에 관리하기 위함 !
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor -> 모든 API 요청 직전에 실행
api.interceptors.request.use(
    (config) => {
        // 로컬 스토리지에서 토큰 가져오기
        const token = localStorage.getItem('accessToken');

        // 토큰 있으면 모든 요청 헤더에 담아서 보내기
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor -> API 응답 직후에 실행 (에러 처리 통합)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 토큰 만료 -> 401 에러나면 자동 로그아웃 등 처리 가능
        if (error.response && error.response.status === 401) {
            console.error('인증 에러가 발생했습니다. 다시 로그인해주세요.');
            localStorage.removeItem('accessToken');
            // 토큰 만료 시 로그인 페이지로 튕기기
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;