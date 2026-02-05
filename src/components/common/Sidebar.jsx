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

        setTimeout(() => {
            const activeSub = navListRef.current.querySelector('.nav-sublink.active');
            const activeMain = navListRef.current.querySelector('.nav-link.active');
            const target = activeSub || activeMain;

            if (target && sidebarRef.current) {
                const rect = target.getBoundingClientRect();
                const sidebarRect = sidebarRef.current.getBoundingClientRect();
                const y = (rect.top - sidebarRect.top) + (rect.height * 0.6);
                // 서브링크 여부 확인
                const isSub = target.classList.contains('nav-sublink');
                setMascotPos({ y, moving: false, isSub });
            }
        }, 50);
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
                setMascotPos({ y, moving: true, isSub });
            } else {
                const activeSub = navListRef.current.querySelector('.nav-sublink.active');
                const activeMain = navListRef.current.querySelector('.nav-link.active');
                const targetActive = activeSub || activeMain;
                if (targetActive) {
                    const rect = targetActive.getBoundingClientRect();
                    const sidebarRect = sidebarRef.current.getBoundingClientRect();
                    const isSub = targetActive.classList.contains('nav-sublink');
                    setMascotPos({ y: (rect.top - sidebarRect.top) + (rect.height * 0.7), moving: true, isSub });
                }
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
    }, [location.pathname, isReportPage]);

    useEffect(() => {
        if (!mascotPos.moving) {
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
                        transition: 'transform 0.3s ease-in-out, height 0.2s ease-in-out',
                        pointerEvents: 'none',
                        zIndex: 10,
                        opacity: mascotPos.y < 0 ? 0 : 1,
                        height: mascotPos.moving 
                                ? '80px' // 기어갈 때 사이즈
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
                                    {item.subItems.map((subItem) => (
                                        <li key={subItem.name}>
                                            <Link to={subItem.path} 
                                                className={`nav-sublink ${location.pathname.startsWith(subItem.path.split('?')[0]) ? 'active' : ''}`}>
                                                {subItem.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                    
                    <li className="nav-item" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <button onClick={() => {
                            const email = localStorage.getItem('userEmail') || 'guest';
                            const role = localStorage.getItem('userRole') || 'USER';
                            localStorage.removeItem(`onboardingCompleted_${role}_${email}`);
                            window.location.href = '/main';
                        }} style={{ width: '100%', padding: '10px', background: '#f5f0e6', color: '#a67c00', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            튜토리얼
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;