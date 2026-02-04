import React, { useState, useEffect, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import './LoginPage.css'; // 같은 스타일 공유

// 이미지 에셋
import rmiImg from '../../assets/img/rmi.png';
import handsUpImg from '../../assets/img/rmi_handsup.png';
import runImg from '../../assets/img/rmi_run.png';
import climbRightImg from '../../assets/img/climb_right.png';

const SignUpPage = () => {
    const navigate = useNavigate();

    // 회원가입 모달은 기본으로 열려있거나, 혹은 버튼 누르면 열리게?
    // "회원가입 페이지"로 들어왔으니 모달이 바로 떠있는게 자연스러움.
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(true);

    // 회원가입 전용 State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState('USER');

    // 페이지 초기화
    useEffect(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
    }, []);

    // 스크롤 애니메이션 (LoginPage와 동일 로직)
    const sectionRefs = useRef([]);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            if (sectionRefs.current) {
                sectionRefs.current.forEach((ref) => ref && observer.unobserve(ref));
            }
        };
    }, []);

    const addToRefs = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
            sectionRefs.current.push(el);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('유효한 이메일 형식을 입력해주세요.');
            return;
        }

        try {
            await signup(email, password, nickname, role);
            alert('회원가입이 완료되었습니다! 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            console.error('회원가입 에러:', error);
            alert(error.message || '가입 중 문제가 발생했습니다.');
        }
    };

    return (
        <div className="landing-container">
            {/* 고정 배경 */}
            <div className="landing-bg"></div>

            {/* 헤더 */}
            <header className="landing-header">
                <div className="header-logo" onClick={() => navigate('/login')}>
                    바르미
                </div>
                {/* 헤더의 로그인 버튼 -> 로그인 페이지로 이동 */}
                <button className="header-login-btn" onClick={() => navigate('/login')}>
                    로그인
                </button>
            </header>

            {/* 배경 컨텐츠 (로그인 페이지와 동일) */}
            <section className="section hero-section" ref={addToRefs}>
                <h1 className="hero-title anim-target delay-1">바르미 사막에 입주해보세요!</h1>
                <p className="hero-subtitle anim-target delay-2">가장 쉽고 재미있는 영어 학습 서비스</p>
                <div style={{ marginTop: '50px' }} className="anim-target delay-3">
                    <img src={rmiImg} alt="Rmi Welcome" style={{ width: '150px', animation: 'bounce 2s infinite' }} />
                </div>
            </section>

            <section className="section feature-section reverse" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={handsUpImg} alt="Pronunciation" className="feature-img" />
                </div>
                <div className="feature-text anim-target delay-2">
                    <h2 className="feature-title">정확한 입모양 교정</h2>
                    <p className="feature-desc">
                        내 발음이 정확한지 궁금하셨나요?<br />
                        AI가 분석해주는 입모양과 혀 위치 가이드를 통해<br />
                        원어민처럼 완벽한 발음을 연습해보세요.
                    </p>
                </div>
            </section>

            <section className="section feature-section" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={runImg} alt="Accessibility" className="feature-img" />
                </div>
                <div className="feature-text anim-target delay-2">
                    <h2 className="feature-title">오직 청각장애인만을 위한 학습</h2>
                    <p className="feature-desc">
                        그동안 영어 학습에 어려움을 느끼셨나요?<br />
                        바르미는 청각장애인을 위한 영어 학습 서비스입니다.<br />
                        매일매일 성장하는 즐거움을 느껴보세요.
                    </p>
                </div>
            </section>

            <section className="section feature-section reverse" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={climbRightImg} alt="Tutoring" className="feature-img" />
                </div>
                <div className="feature-text anim-target delay-2">
                    <h2 className="feature-title">비대면 튜터링</h2>
                    <p className="feature-desc">
                        혼자서 어렵다면 전문가와 함께.<br />
                        실시간 화상 튜터링으로<br />
                        더욱 꼼꼼한 피드백을 받아보세요.
                    </p>
                </div>
            </section>


            {/* 회원가입 모달 (Open by Default) */}
            {isSignupModalOpen && (
                <div className="modal-overlay">
                    {/* 오버레이 클릭해도 안닫히게 할지 여부는 선택이지만, 페이지 자체가 회원가입이므로 닫히면 이상함. 
                        하지만 사용자가 배경을 보고싶을 수 있으니 닫기는 X버튼이나 라우팅으로.
                    */}
                    <div className="login-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-title-area">
                            <span className="modal-logo">바르미</span>
                            <span className="modal-subtitle">미어캣이 되어주세요!</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                            <Button
                                type="button"
                                className={role === 'USER' ? 'btn-gold' : 'btn-grey'}
                                onClick={() => setRole('USER')}
                                style={{ opacity: role === 'USER' ? 1 : 0.5, padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                학생
                            </Button>
                            <Button
                                type="button"
                                className={role === 'TUTOR' ? 'btn-gold' : 'btn-grey'}
                                onClick={() => setRole('TUTOR')}
                                style={{ opacity: role === 'TUTOR' ? 1 : 0.5, padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                선생님
                            </Button>
                        </div>

                        <form onSubmit={handleSignup} className="modal-form">
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

                            <button type="submit" className="modal-btn">
                                가입하기
                            </button>
                        </form>

                        <div className="signup-link-area">
                            이미 계정이 있으신가요?
                            <span className="signup-link" onClick={() => navigate('/login', { state: { openModal: true } })}>
                                로그인하기
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignUpPage;