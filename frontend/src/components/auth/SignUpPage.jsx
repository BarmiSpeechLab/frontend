import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import rmiImg from '../../assets/img/rmi.png';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import './LoginPage.css';

const SignUpPage = () => {
    const navigate = useNavigate();

    // role -> 튜티 / 튜터
    const [role, setRole] = useState('tutee');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            // role 정보도 함께 전송 (API 수정 필요 시 반영 !)
            await signup(email, password, nickname, role);
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            console.error('회원가입 에러:', error);
            alert(error.message || '가입 중 문제가 발생했습니다.');
        }
    };

    return (
        <div className="login-container">
            <div className="logo-area">
                <h1 className="logo-text">
                    <span className="logo-char">회</span>
                    <span className="logo-char">원</span>
                    <span className="logo-char">가</span>
                    <span className="logo-char">입</span>
                </h1>
            </div>

            <div className="mascot-area">
                <img src={rmiImg} alt="Rmi" className="mascot-img" />
            </div>

            <div className="role-selection-area" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <Button
                        type="button"
                        className={role === 'tutee' ? 'btn-gold' : 'btn-grey'}
                        onClick={() => setRole('tutee')}
                        style={{ opacity: role === 'tutee' ? 1 : 0.5, whiteSpace: 'nowrap' }}
                    >
                        학생
                    </Button>
                    <Button
                        type="button"
                        className={role === 'tutor' ? 'btn-gold' : 'btn-grey'}
                        onClick={() => setRole('tutor')}
                        style={{ opacity: role === 'tutor' ? 1 : 0.5, whiteSpace: 'nowrap' }}
                    >
                        선생님
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSignup} className="login-form">
                <Input
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    placeholder="닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button type="submit" className="btn-gold login-submit-btn">
                    가입하기
                </Button>
            </form>

            <div className="divider-area">
                <div className="divider-line"></div>
                <div className="divider-text">
                    이미 계정이 있으신가요?
                </div>
            </div>

            <div className="signup-area">
                <Button
                    type="button"
                    className="btn-gold"
                    onClick={() => navigate('/login')}
                >
                    로그인하러 가기
                </Button>
            </div>
        </div>
    );
};

export default SignUpPage;