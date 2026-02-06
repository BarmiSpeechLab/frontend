import React, { useState, useEffect, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';
import { login } from '../../api/auth';
import { getUserProfile } from '../../api/user';
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

    // 현재 보고 있는 섹션 인덱스
    const [currentSection, setCurrentSection] = useState(0);
    const isScrolling = useRef(false); // 스크롤 중복 방지 플래그
    const containerRef = useRef(null); // 스크롤 컨테이너 참조
    const sectionRefs = useRef([]); // 섹션 요소 참조 배열

    // 섹션 요소들을 순서대로 관리하기 위해 Ref 저장 함수 수정
    // (DOM 순서대로 정렬되지 않을 수 있으므로, 렌더링 후 정렬하거나 인덱스로 접근)
    // 여기서는 간단히 sectionRefs를 배열로 관리하고, 초기화 시점에 비우도록 함

    // 컴포넌트 마운트 시 sectionRefs 초기화는 그대로 유지하되,
    // 순서를 보장하기 위해 각 섹션에 id나 data-index를 주는 것이 좋음.
    // 하지만 현재 구조상 순차적으로 렌더링되므로 ref callback 순서를 믿거나,
    // querySelectorAll로 다시 잡는 것이 확실함.

    useEffect(() => {
        // 확실한 순서 보장을 위해 DOM 쿼리 사용 (ref 콜백은 순서 보장 안될 수 있음)
        if (containerRef.current) {
            const sections = containerRef.current.querySelectorAll('.section');
            sectionRefs.current = Array.from(sections);
        }
    }, []);

    // 휠 이벤트 핸들러
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault(); // 기본 스크롤 방지

            if (isScrolling.current) return; // 애니메이션 중이면 무시

            const delta = e.deltaY;
            const threshold = 50; // 감도 조절

            if (Math.abs(delta) < threshold) return;

            let nextSection = currentSection;

            if (delta > 0) {
                // 아래로 스크롤
                if (currentSection < sectionRefs.current.length) { // 마지막은 footer 등이 없으므로 section 개수제한
                    // 마지막 섹션(CTA) 이후로는 더 안 내려감
                    if (currentSection < sectionRefs.current.length - 1) {
                        nextSection = currentSection + 1;
                    }
                }
            } else {
                // 위로 스크롤
                if (currentSection > 0) {
                    nextSection = currentSection - 1;
                }
            }

            if (nextSection !== currentSection) {
                scrollToSection(nextSection);
            }
        };

        // passive: false 여야 preventDefault 가능
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            if (container) container.removeEventListener('wheel', handleWheel);
        };
    }, [currentSection]); // currentSection이 바뀔 때마다 이벤트 리스너 갱신 (closure 문제 방지)

    const scrollToSection = (index) => {
        isScrolling.current = true;
        setCurrentSection(index);

        const target = sectionRefs.current[index];
        if (target) {
            // 부드러운 이동
            containerRef.current.scrollTo({
                top: target.offsetTop,
                behavior: 'smooth'
            });

            // 스크롤 애니메이션 시간(약 500ms~1s) 동안 락 걸기
            // CSS transition과 얼추 비슷하게 맞춤
            setTimeout(() => {
                isScrolling.current = false;
            }, 800);
        } else {
            isScrolling.current = false;
        }
    };

    // 로고 클릭시 최상단 이동
    const scrollToTop = () => {
        scrollToSection(0);
    };

    // 스크롤 애니메이션 (Intersection Observer) - 기존 유지 (등장 효과 위함)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.2 }
        );

        // sectionRef가 업데이트 된 후 관찰
        if (sectionRefs.current) {
            sectionRefs.current.forEach((ref) => {
                if (ref) observer.observe(ref);
            });
        }

        return () => observer.disconnect();
    }, []); // deps 빈배열: 마운트 시 한 번만 실행 (sections가 다 렌더링 된 후라고 가정)

    const addToRefs = (el) => {
        // ref 콜백은 렌더링 중에 실행됨.
        // 여기서는 아무것도 안 하고, useEffect에서 querySelectorAll로 한 번에 잡는 게 
        // 순서 보장에 더 유리하므로 비워두거나 제거해도 됨.
        // 하지만 기존 코드 호환성을 위해 남겨둠 (실제로는 useEffect에서 덮어씌움)
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);

            // Try robustly to find nickname from various probable paths
            let nickname = response.nickname
                || response.data?.nickname
                || response.nickName
                || response.data?.nickName;

            // 2. 토큰 및 이메일 저장 (먼저 저장해야 getUserProfile 호출 시 헤더에 실림)
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('userEmail', email);

            // 닉네임이 없으면 정보 조회 시도
            if (!nickname || nickname === 'undefined') {
                try {
                    const userInfo = await getUserProfile();
                    // userInfo is likely response.data.data from api/user.js
                    nickname = userInfo.nickname || userInfo.data?.nickname || userInfo.nickName;
                } catch (infoError) {
                    console.error('사용자 정보 조회 실패:', infoError);
                }
            }

            // 최종 닉네임 저장
            if (nickname && nickname !== 'undefined') {
                localStorage.setItem('userNickname', nickname);
            } else {
                // If we still don't have a valid nickname, try to use part of email or fallback
                // But better to remove it so OnboardingModal handles the default
                localStorage.removeItem('userNickname');
            }

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
                <div className="header-logo" onClick={scrollToTop}>
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
            <section className="section hero-section">
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
            <section className="section feature-section reverse">
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={login3} alt="Pronunciation" className="feature-img" />
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
            <section className="section feature-section">
                <div className="feature-img-wrapper anim-target delay-1">
                    <img src={login2} alt="Accessibility" className="feature-img" />
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
            <section className="section feature-section reverse">
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
            <section className="section cta-section">
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
