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
    
    // y: 위치, moving: 움직임 여부, isSub: 서브메뉴 여부
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
    const isLearningSubActive = ['/learning/topic', '/learning/practice', '/pronunciation', '/learning'].includes(location.pathname) || location.pathname.startsWith('/learning');
    const isReportPage = location.pathname === '/report';

    const updateToActivePosition = () => {
        if (!navListRef.current || isReportPage) return;

        // [핵심 수정] 위치를 다시 계산하기 전까지 미어캣의 움직임을 중단시켜 헛발질을 방지합니다.
        setMascotPos(prev => ({ ...prev, moving: false }));

        setTimeout(() => {
            const currentFullBuffer = location.pathname + location.search;
            const allLinks = navListRef.current.querySelectorAll('.nav-sublink, .nav-link');
            
            // 현재 주소와 href가 완벽히 일치하는 타겟 탐색
            let target = Array.from(allLinks).find(link => 
                link.getAttribute('href') === currentFullBuffer
            );

            // 상세 페이지일 경우 mode 쿼리 파라미터로 부모 메뉴 매칭
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
        }, 80); // 딜레이를 최적화하여 반응 속도를 높임
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
                
                // 불필요한 미세 움직임 방지 및 이동 상태 활성화
                setMascotPos(prev => {
                    if (Math.abs(prev.y - y) < 1) return prev;
                    return { y, moving: true, isSub };
                });
            }
        };

        const handleMouseLeaveSidebar = () => {
            updateToActivePosition();
        };

        // 초기 로드 및 경로 변경 시 실행
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
        // search(?mode=...) 변경 시에도 미어캣 위치를 다시 잡도록 설정
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
                        // 부드러운 이동을 유지하되 목적지 변경 시 튀는 느낌을 줄임
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
                                        const isSubActive = (location.pathname + location.search) === subItem.path;
                                        return (
                                            <li key={subItem.name}>
                                                <Link
                                                    to={subItem.path}
                                                    className={`nav-sublink ${isSubActive ? 'active' : ''}`}
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