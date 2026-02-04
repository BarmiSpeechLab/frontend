import React, { useState, useEffect, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';
import { login } from '../../api/auth';
import { jwtDecode } from "jwt-decode";

// 이미지 에셋
import rmiImg from '../../assets/img/rmi.png';
import handsUpImg from '../../assets/img/rmi_handsup.png';
import runImg from '../../assets/img/rmi_run.png';
import climbRightImg from '../../assets/img/climb_right.png';

// 애니메이션 이미지 에셋
import login1 from '../../assets/img/login/login1.png';
import login2 from '../../assets/img/login/login2.png';
import login3 from '../../assets/img/login/login3.png';
import login4 from '../../assets/img/login/login4.png';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // location.state가 있으면 true로 초기화 -> 바로 열림
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(!!location.state?.openModal);

    // 로그인 Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 자동 로그인 체크
    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            navigate('/main');
        }
    }, [navigate]);

    // 모달 자동 열림 상태가 있다면, 이력(History)에서 제거 (새로고침 시 다시 열림 방지)
    useEffect(() => {
        if (location.state?.openModal) {
            // 현재 URL은 유지하되, state만 비움
            window.history.replaceState({}, '');
        }
    }, [location]);

    // 모달 닫을 때 초기화
    useEffect(() => {
        if (!isLoginModalOpen) {
            setEmail('');
            setPassword('');
        }
    }, [isLoginModalOpen]);

    // 스크롤 애니메이션 (Intersection Observer)
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
            { threshold: 0.1 } // 10% 보이면 트리거
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

    // 스크롤 컨테이너 참조 (Scroll Snap 적용으로 인해 window 대신 컨테이너를 스크롤해야 함)
    const containerRef = useRef(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('userEmail', email);

            try {
                const decoded = jwtDecode(response.accessToken);
                if (decoded.sub) localStorage.setItem('userId', decoded.sub);
                const decodedRole = decoded?.auth?.includes('TUTOR') ? 'TUTOR' : 'USER';
                localStorage.setItem('userRole', decodedRole);
            } catch (decodeError) {
                console.error('토큰 해독 실패:', decodeError);
                localStorage.setItem('userRole', 'USER');
            }
            navigate('/main');
        } catch (error) {
            console.error('로그인 에러:', error);
            alert(error.message || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="landing-container" ref={containerRef}>
            {/* 고정 배경 */}
            <div className="landing-bg"></div>

            {/* 헤더 */}
            <header className="landing-header">
                <div className="header-logo" onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                    바르미
                </div>
                <button
                    className="header-login-btn"
                    onClick={() => setIsLoginModalOpen(true)}
                >
                    로그인
                </button>
            </header>

            {/* 섹션 1: 히어로 */}
            <section className="section hero-section" ref={addToRefs}>
                <h1 className="hero-title anim-target delay-1">바르미 마을에 입주해보세요!</h1>
                <p className="hero-subtitle anim-target delay-2">가장 쉽고 재미있는 영어 학습 서비스</p>
                <div style={{ marginTop: '50px' }} className="anim-target delay-3">
                    <img
                        src={login1}
                        alt="Rmi Welcome"
                        className="hero-img"
                    />
                </div>
            </section>

            {/* 섹션 2: 청각장애인을 위한 학습 */}
            <section className="section feature-section reverse" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={login2} alt="Pronunciation" className="feature-img" />
                </div>
                <div className="feature-text anim-target delay-2">
                    <h2 className="feature-title">청각장애인을 위해</h2>
                    <p className="feature-desc">
                        그동안 영어학습에 어려움을 느끼셨나요?<br />
                        바르미는 청각장애인만을 위한 영어 학습 서비스입니다.<br />
                        매일매일 성장하는 즐거움을 느껴보세요.
                    </p>
                </div>
            </section>

            {/* 섹션 3: 발음 교정 */}
            <section className="section feature-section" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={login3} alt="Accessibility" className="feature-img" />
                </div>
                <div className="feature-text anim-target delay-2">
                    <h2 className="feature-title">정확한 입모양 교정</h2>
                    <p className="feature-desc">
                        내 발음이 정확한지 궁금하셨나요?<br />
                        입모양과 혀 위치 가이드를 통해<br />
                        완벽한 발음을 연습해보세요.
                    </p>
                </div>
            </section>

            {/* 섹션 4: 비대면 튜터링 */}
            <section className="section feature-section reverse" ref={addToRefs}>
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={login4} alt="Tutoring" className="feature-img tutoring-img" />
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

            {/* 섹션 5: CTA (하단 강조) */}
            <section className="section cta-section" ref={addToRefs}>
                <h2 className="cta-title anim-target delay-1">바르미와 함께 해보세요!</h2>
                <button
                    className="cta-btn anim-target delay-2"
                    onClick={() => setIsLoginModalOpen(true)}
                >
                    지금 시작하기
                </button>
            </section>

            {/* 로그인 모달 */}
            {isLoginModalOpen && (
                <div className="modal-overlay" onClick={() => setIsLoginModalOpen(false)}>
                    <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setIsLoginModalOpen(false)}>✕</button>

                        <div className="modal-title-area">
                            <span className="modal-logo">바르미</span>
                            <span className="modal-subtitle">다시 만나서 반가워요!</span>
                        </div>

                        <form onSubmit={handleLogin} className="modal-form">
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

                            <button type="submit" className="modal-btn">
                                로그인하기
                            </button>
                        </form>

                        <div className="signup-link-area">
                            아직 회원이 아니신가요?
                            <span className="signup-link" onClick={() => navigate('/signup')}>
                                가입하기
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;