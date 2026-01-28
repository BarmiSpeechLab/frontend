import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute
 * 로그인 X 유저가 접근 시도 시 로그인 페이지로 튕겨짐
 */
const ProtectedRoute = () => {
    // 로컬 스토리지에 토큰 있는지 확인
    const isAuthenticated = !!localStorage.getItem('accessToken');

    if (!isAuthenticated) {
        console.warn('[보호된 경로] 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        return <Navigate to="/login" replace />;
    }

    // 토큰 있으면 요청 페이지 그대로 보여줌
    return <Outlet />;
};

export default ProtectedRoute;
