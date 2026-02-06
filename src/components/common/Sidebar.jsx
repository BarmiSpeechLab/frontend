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
        { name: '회화연습', path: '/conversation', roles: ['USER'] },
        { name: '리포트', path: '/report', roles: ['USER', 'TUTOR'] },
        { name: '튜터링', path: '/tutoring', roles: ['USER', 'TUTOR'] },
        { name: '일정 관리', path: '/schedule', roles: ['TUTOR'] },
        { name: '프로필', path: '/profile', roles: ['USER', 'TUTOR'] },
    ];

    const fileteredMenuItems = allmenuItems.filter(item => item.roles.includes(userRole));
    
    // [수정] 상세 페이지(/pronunciationPractice)도 학습하기 서브 메뉴 활성화 범위에 포함
    const isLearningSubActive = [
        '/learning/topic', 
        '/learning/practice', 
        '/pronunciation', 
        '/learning', 
        '/pronunciationPractice'
    ].some(path => location.pathname.startsWith(path));

    const isReportPage = location.pathname === '/report';

    const updateToActivePosition = () => {
        if (!navListRef.current || isReportPage) return;

        // 위치 계산 전까지 미어캣의 움직임을 즉시 중단 (헛발질 방지)
        setMascotPos(prev => ({ ...prev, moving: false }));

        setTimeout(() => {
            const currentFullBuffer = location.pathname + location.search;
            const allLinks = navListRef.current.querySelectorAll('.nav-sublink, .nav-link');
            
            // 1. 현재 주소(쿼리 포함)와 href가 완벽히 일치하는 타겟 탐색
            let target = Array.from(allLinks).find(link => 
                link.getAttribute('href') === currentFullBuffer
            );

            // 2. 일치하는 게 없다면(상세페이지인 경우) mode 파라미터로 부모 메뉴 매칭
            if (!target && location.pathname === '/pronunciationPractice') {
                const params = new URLSearchParams(location.search);
                const mode = params.get('mode');
                target = Array.from(allLinks).find(link => {
                    const linkHref = link.getAttribute('href');
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

                // 정확한 목적지가 확인된 후에만 위치를 갱신
                setMascotPos({ y: newY, moving: false, isSub });
            }
        }, 120); // 클래스 반영 및 렌더링을 위해 안정적인 시간(120ms) 부여
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
    }, [location.pathname, location.search, isReportPage]);

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

            <nav className="sidebar-nav" style={{ marginTop: isReportPage ? '6rem' : '0' }}>
                <ul className="nav-list" ref={navListRef}>
                    {fileteredMenuItems.map((item) => (
                        <li key={item.name} className="nav-item" 
                            onMouseEnter={() => setHoveredMenu(item.name)} 
                            onMouseLeave={() => setHoveredMenu(null)}>
                            {item.subItems ? (
                                <div className={`nav-link ${isLearningSubActive && item.name === '학습하기' ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                    {item.name}
                                </div>
                            ) : (
                                <Link to={item.path} className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}>
                                    {item.name}
                                </Link>
                            )}
                            
                            {(item.name === '학습하기' && (hoveredMenu === item.name || isLearningSubActive)) && item.subItems && (
                                <ul className="nav-submenu">
                                    {item.subItems.map((subItem) => {
                                        // [핵심] 현재 URL(pathname+search)이 서브 아이템의 path와 일치하거나,
                                        // 상세페이지에서 mode가 일치할 경우 active 클래스 부여
                                        const params = new URLSearchParams(location.search);
                                        const mode = params.get('mode');
                                        const isExactPath = (location.pathname + location.search) === subItem.path;
                                        const isModeMatch = location.pathname === '/pronunciationPractice' && (
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
                    
                    <li className="nav-item tutorial-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <button onClick={() => {
                            const email = localStorage.getItem('userEmail') || 'guest';
                            const role = localStorage.getItem('userRole') || 'USER';
                            localStorage.removeItem(`onboardingCompleted_${role}_${email}`);
                            window.location.href = '/main';
                        }} className="tutorial-btn" style={{ width: '100%', padding: '10px', background: '#f5f0e6', color: '#a67c00', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            튜토리얼
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;