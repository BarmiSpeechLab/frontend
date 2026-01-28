import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import rmiImg from '../../assets/img/rmi.png';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { login } from '../../api/auth';
// import { getUserProfile } from '../../api/user'; -> 나중에 연동 시 주석 해제 필요

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 앱 시작 시 or 로그인 페이지 진입 시 이미 토큰 있으면 메인으로 이동
    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            navigate('/main');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // 로그인 요청
            const response = await login(email, password);

            // 받은 토큰 저장 + 이메일 저장
            localStorage.setItem('accessToken', response.token);
            localStorage.setItem('userEmail', email); // 튜토리얼 완료 여부 확인 위해 저장

            /*
            // 나중에 연동 시 주석 해제 필요
            const userProfile = await getUserProfile();
            console.log('User Profile:', userProfile);
            localStorage.setItem('userRole', userProfile.role); // 서버에서 던져준 역할 저장
            */

            // 테스트용 - 백엔드 연동 전 role 테스트 위해 임시 생성
            // 이메일에 'tutor' 포함되면 튜터 권한 부여
            // 나중에 연동 시 삭제 필요
            if (email.includes('tutor')) {
                localStorage.setItem('userRole', 'TUTOR');
                console.log('테스트 - 튜터 로그인');
            } else {
                localStorage.setItem('userRole', 'USER');
                console.log('테스트 - 유저(학생) 로그인');
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