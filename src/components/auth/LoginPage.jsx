import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import rmiImg from '../../assets/img/rmi.png';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

import { login, signup } from '../../api/auth';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // 로그인 요청
            const response = await login(email, password);

            // 받은 토큰 저장
            localStorage.setItem('accessToken', response.token);

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
                    로그인하여 학습을 시작하세요.
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