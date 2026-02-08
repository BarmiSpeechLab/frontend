import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import rmiRun from '../../assets/img/rmi_run.png';
import climbLeft from '../../assets/img/climb_left.png';
import climbRight from '../../assets/img/climb_right.png';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [isLearningOpen, setIsLearningOpen] = useState(false); // New state for click toggle
    const sidebarRef = useRef(null);
    const navListRef = useRef(null);

    const [mascotPos, setMascotPos] = useState({ y: -100, moving: false, isSub: false });
    const [frameIndex, setFrameIndex] = useState(0);
    const animationIntervalRef = useRef(null);

    const userRole = localStorage.getItem('userRole') || 'USER';

    const allmenuItems = [
        {
            name: '학습하기',
            path: '/learning',
            roles: ['USER'],
            subItems: [
                { name: '발음기호', path: '/pronunciation' },
                { name: '단어 학습', path: '/learning?mode=WORD' },
                { name: '문장 학습', path: '/learning?mode=SENTENCE' }
            ]
        },
        { name: '회화 연습', path: '/conversation', roles: ['USER'] },
        { name: '리포트', path: '/report', roles: ['USER', 'TUTOR'] },
        { name: '튜터링', path: '/tutoring', roles: ['USER', 'TUTOR'] },
        { name: '일정 관리', path: '/schedule', roles: ['TUTOR'] },
        { name: '프로필', path: '/profile', roles: ['USER', 'TUTOR'] },
    ];

    const fileteredMenuItems = allmenuItems.filter(item => item.roles.includes(userRole));

    // 쿼리 스트링(?mode=)이 있을 때만 상세 학습 중으로 간주
    const isActuallyLearningDetail = location.pathname === '/learning' && location.search !== "";
    const isPronunciationPage = location.pathname.startsWith('/pronunciation') || location.pathname === '/pronunciationPractice';

    // 학습하기 서브 메뉴 활성화 범위 (색칠용)
    const isLearningSubActive = isActuallyLearningDetail || isPronunciationPage || location.pathname === '/learning';

    const isReportPage = location.pathname === '/report';

    useEffect(() => {
        // Automatically open if on a learning sub-page
        if (isLearningSubActive) {
            setIsLearningOpen(true);
        }
    }, [isLearningSubActive]);

    const updateToActivePosition = () => {
        if (!navListRef.current || isReportPage) return;

        setMascotPos(prev => ({ ...prev, moving: false }));

        setTimeout(() => {
            const currentFullBuffer = location.pathname + location.search;
            const allLinks = navListRef.current.querySelectorAll('.nav-sublink, .nav-link');

            // 1. 현재 주소(쿼리 포함)와 href가 완벽히 일치하는 타겟 탐색
            let target = Array.from(allLinks).find(link =>
                link.getAttribute('href') === currentFullBuffer
            );

            // 2. 모드 없는 /learning 일 경우 (선택 화면) -> 대메뉴 '학습하기'를 강제 타겟팅
            if (location.pathname === '/learning' && location.search === "") {
                target = Array.from(allLinks).find(link =>
                    link.innerText.trim() === '학습하기' && link.classList.contains('nav-link')
                );
            }

            // 튜터링 예약 페이지 하위 경로 대응 추가
            if (!target && location.pathname.startsWith('/tutoring')) {
                target = Array.from(allLinks).find(link =>
                    link.getAttribute('href') === '/tutoring'
                );
            }

            // 3. 상세페이지 대응 로직
            if (!target && location.pathname === '/pronunciationPractice') {
                const params = new URLSearchParams(location.search);
                const mode = params.get('mode');
                target = Array.from(allLinks).find(link => {
                    const linkHref = link.getAttribute('href');
                    if (!linkHref) return false;
                    if (mode === 'PRON') return linkHref.includes('/pronunciation');
                    if (mode === 'WORD') return linkHref.includes('mode=WORD');
                    if (mode === 'SENTENCE') return linkHref.includes('mode=SENTENCE');
                    return false;
                });
            }

            if (target && sidebarRef.current) {
                const rect = target.getBoundingClientRect();
                const sidebarRect = sidebarRef.current.getBoundingClientRect();
                const newY = (rect.top - sidebarRect.top) + (rect.height * 0.5);
                const isSub = target.classList.contains('nav-sublink');

                setMascotPos({ y: newY, moving: false, isSub });
            }
        }, 120);
    };

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (isReportPage) return;
            const target = event.target.closest('.nav-sublink, .nav-link');

            if (target) {
                const rect = target.getBoundingClientRect();
                const sidebarRect = sidebarRef.current.getBoundingClientRect();
                const y = (rect.top - sidebarRect.top) + (rect.height * 0.7);
                const isSub = target.classList.contains('nav-sublink');

                setMascotPos(prev => {
                    if (Math.abs(prev.y - y) < 1) return prev;
                    return { y, moving: true, isSub };
                });
            }
        };

        const handleMouseLeaveSidebar = () => {
            updateToActivePosition();
        };

        updateToActivePosition();

        const sidebarNode = sidebarRef.current;
        if (sidebarNode && !isReportPage) {
            sidebarNode.addEventListener('mousemove', handleMouseMove);
            sidebarNode.addEventListener('mouseleave', handleMouseLeaveSidebar);
        }

        return () => {
            if (sidebarNode) {
                sidebarNode.removeEventListener('mousemove', handleMouseMove);
                sidebarNode.removeEventListener('mouseleave', handleMouseLeaveSidebar);
            }
        };
    }, [location.pathname, location.search, isReportPage, isLearningOpen]); // Re-calc when menu opens/closes

    useEffect(() => {
        if (!mascotPos.moving) {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
            setFrameIndex(0);
            return;
        }
        animationIntervalRef.current = setInterval(() => {
            setFrameIndex((prev) => 1 - prev);
        }, 300);
        return () => {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        };
    }, [mascotPos.moving]);

    const handleMenuClick = (item) => {
        if (item.subItems) {
            setIsLearningOpen(!isLearningOpen);
        } else {
            navigate(item.path);
        }
    };

    return (
        <aside className="sidebar" ref={sidebarRef}>
            {!isReportPage && (
                <img
                    src={mascotPos.moving
                        ? (frameIndex === 0 ? climbLeft : climbRight)
                        : rmiRun
                    }
                    alt="미어캣"
                    className="sidebar-mascot"
                    style={{
                        transform: `translateY(${mascotPos.y}px) translateY(-50%) scaleX(-1)`,
                        position: 'absolute',
                        right: '20px',
                        transition: mascotPos.moving
                            ? 'transform 0.3s ease-out, height 0.2s ease-in-out'
                            : 'transform 0.2s ease-in-out, height 0.2s ease-in-out',
                        pointerEvents: 'none',
                        zIndex: 10,
                        opacity: mascotPos.y < 0 ? 0 : 1,
                        height: mascotPos.moving
                            ? '80px'
                            : (mascotPos.isSub ? '70px' : '90px'),
                        width: 'auto',
                        objectFit: 'contain'
                    }}
                />
            )}

            <button className="sidebar-logo" onClick={() => navigate('/main')} title="홈으로">
                <span className="logo-char">바</span>
                <span className="logo-char">르</span>
                <span className="logo-char">미</span>
            </button>

            <nav className="sidebar-nav">
                <ul className="nav-list" ref={navListRef}>
                    {fileteredMenuItems.map((item) => (
                        <li key={item.name} className="nav-item"
                            onMouseEnter={() => setHoveredMenu(item.name)}
                            onMouseLeave={() => setHoveredMenu(null)}>
                            {item.subItems ? (
                                <div
                                    className={`nav-link ${isLearningSubActive && item.name === '학습하기' ? 'active' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleMenuClick(item)}
                                >
                                    {item.name}
                                </div>
                            ) : (
                                <Link to={item.path} className={`nav-link ${location.pathname.startsWith(item.path) && item.path === '/tutoring' ? 'active' : (location.pathname === item.path ? 'active' : '')}`}>
                                    {item.name}
                                </Link>
                            )}

                            {/* 토글 열림 조건: 클릭 상태(isLearningOpen)일 때만 */}
                            {(item.name === '학습하기' && isLearningOpen) && item.subItems && (
                                <ul className="nav-submenu">
                                    {item.subItems.map((subItem) => {
                                        const params = new URLSearchParams(location.search);
                                        const mode = params.get('mode');
                                        const isExactPath = (location.pathname + location.search) === subItem.path;
                                        const isModeMatch = (location.pathname === '/pronunciationPractice' || location.pathname === '/learning') && (
                                            (mode === 'WORD' && subItem.path.includes('mode=WORD')) ||
                                            (mode === 'SENTENCE' && subItem.path.includes('mode=SENTENCE')) ||
                                            (mode === 'PRON' && subItem.path.includes('/pronunciation'))
                                        );

                                        return (
                                            <li key={subItem.name}>
                                                <Link
                                                    to={subItem.path}
                                                    className={`nav-sublink ${isExactPath || isModeMatch ? 'active' : ''}`}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    ))}

                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;