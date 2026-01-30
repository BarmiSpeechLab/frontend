import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import rmiImg from '../../assets/img/rmi.png';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { login } from '../../api/auth';
import { getUserProfile } from '../../api/user';
import { jwtDecode } from "jwt-decode"; // 토큰 해독용 라이브러리

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 앱 시작 시 or 로그인 페이지 진입 시 이미 토큰 있으면 메인으로 자동 이동
    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            navigate('/main');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // 1. 로그인 요청
            const response = await login(email, password);

            // 2. 토큰 및 이메일 저장
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('userEmail', email); // 튜토리얼 완료 여부 확인 위해 저장

            // 3. API 시도 -> 실패 시 토큰 해독
            try {
                // (1) 백엔드 API 연동 시도
                const userProfile = await getUserProfile();
                console.log('백엔드에서 프로필 정보 수신 성공:', userProfile);
                localStorage.setItem('userRole', userProfile.role || 'USER');
            } catch (apiError) {
                // (2) API 실패 시 -> 토큰 직접 해독 시도
                console.warn('프로필 조회 실패, 토큰 해독을 시도합니다.');

                try {
                    const decoded = jwtDecode(response.accessToken);
                    if (decoded && decoded.auth) {
                        // auth 확인
                        const role = decoded.auth.includes('TUTOR') ? 'TUTOR' : 'USER';
                        localStorage.setItem('userRole', role);
                        console.log(`역할 확인 완료: ${role}`);
                    } else {
                        localStorage.setItem('userRole', 'USER');
                        console.log('역할 정보 없음, 기본값 적용');
                    }
                } catch (decodeError) {
                    console.error('토큰 해독 실패:', decodeError);
                    localStorage.setItem('userRole', 'USER');
                }
            }

            navigate('/main');
        } catch (error) {
            console.error('로그인 에러:', error);
            alert(error.message || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="login-container">

            <div className="logo-area">
                <h1 className="logo-text">
                    <span className="logo-char">바</span>
                    <span className="logo-char">르</span>
                    <span className="logo-char">미</span>
                </h1>
            </div>

            <div className="mascot-area">
                <img
                    src={rmiImg}
                    alt="Rmi"
                    className="mascot-img"
                />
            </div>
            <div className="welcome-area">
                <h2 className="welcome-title">환영합니다!</h2>
                <p className="welcome-subtitle">
                    로그인 또는 계정을 생성해주세요.
                </p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
                <Input
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button type="submit" className="btn-gold login-submit-btn">
                    로그인
                </Button>
            </form>

            <div className="divider-area">
                <div className="divider-line"></div>
                <div className="divider-text">
                    계정이 없으신가요?
                </div>
            </div>

            <div className="signup-area">
                <Button
                    type="button"
                    className="btn-gold"
                    onClick={() => navigate('/signup')}
                >
                    회원가입
                </Button>
            </div>
        </div>
    );
};

export default LoginPage;