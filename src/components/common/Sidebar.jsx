import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import rmi from '../../assets/img/rmi.png';
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
    const [mascotPos, setMascotPos] = useState({ y: 0, visible: false });
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
                { name: '문장 학습', path: '/learning?mode=SENTENCE' },
                { name: '회화 연습', path: '/conversation' }
            ]
        },
        { name: '리포트', path: '/report', roles: ['USER', 'TUTOR'] },
        { name: '튜터링', path: '/tutoring', roles: ['USER', 'TUTOR'] },
        { name: '일정 관리', path: '/schedule', roles: ['TUTOR'] },
        { name: '프로필', path: '/profile', roles: ['USER', 'TUTOR'] },
    ];

    const fileteredMenuItems = allmenuItems.filter(item => item.roles.includes(userRole));
    const isLearningSubActive = ['/learning/topic', '/learning/practice', '/pronunciation', '/conversation', '/learning'].includes(location.pathname) || location.pathname.startsWith('/learning');

    // 현재 active 메뉴 찾기 및 Y 위치 계산
    const getActiveMenuIndex = () => {
        let activeIndex = -1;
        fileteredMenuItems.forEach((item, index) => {
            if (item.subItems) {
                // 서브메뉴가 있는 경우
                if (item.subItems.some(sub => location.pathname === sub.path)) {
                    activeIndex = index;
                }
            } else if (location.pathname === item.path) {
                // 일반 메뉴
                activeIndex = index;
            }
        });
        return activeIndex;
    };

    const activeMenuIndex = getActiveMenuIndex();
    const getActiveMenuY = () => {
        if (activeMenuIndex === -1 || !navListRef.current || !sidebarRef.current) return null;

        const navRect = navListRef.current.getBoundingClientRect();
        const sidebarRect = sidebarRef.current.getBoundingClientRect();

        // nav-list의 시작점 (sidebar 기준)
        const navListTop = navRect.top - sidebarRect.top;

        // 각 메뉴 아이템이 약 50px (padding + gap 포함)
        const menuItemHeight = 50;
        const menuY = navListTop + (activeMenuIndex * menuItemHeight) + 25; // 25는 메뉴 중앙

        return menuY;
    };

    // 마우스 호버 시 애니메이션 처리
    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!navListRef.current || !sidebarRef.current) return;

            const navRect = navListRef.current.getBoundingClientRect();
            const sidebarRect = sidebarRef.current.getBoundingClientRect();

            // sidebar 기준으로 Y 좌표 계산
            const y = event.clientY - sidebarRect.top;
            const navListTop = navRect.top - sidebarRect.top;

            // nav-list의 메뉴 아이템 부분만의 높이 (튜토리얼 제외)
            // 각 nav-item이 약 50px (padding + gap 포함) + 여유분 50px
            const estimatedMenuHeight = fileteredMenuItems.length * 50 + 50;

            // 메뉴 영역 내에서만 보이기
            if (y >= navListTop && y <= navListTop + estimatedMenuHeight) {
                setMascotPos({ y, visible: true });
            } else {
                setMascotPos((prev) => ({ ...prev, visible: false }));
            }
        };

        const handleMouseLeave = () => {
            setMascotPos((prev) => ({ ...prev, visible: false }));
        };

        const node = navListRef.current;
        if (!node) return undefined;
        node.addEventListener('mousemove', handleMouseMove);
        node.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            node.removeEventListener('mousemove', handleMouseMove);
            node.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [fileteredMenuItems.length]);

    // 프레임 애니메이션 - mascotPos.visible이 true일 때만 실행
    useEffect(() => {
        const shouldAnimate = mascotPos.visible;

        if (!shouldAnimate) {
            setFrameIndex(0);
            return;
        }

        animationIntervalRef.current = setInterval(() => {
            setFrameIndex((prev) => 1 - prev); // 0과 1을 번갈아가며 토글
        }, 300);

        return () => {
            if (animationIntervalRef.current) {
                clearInterval(animationIntervalRef.current);
            }
        };
    }, [mascotPos.visible, activeMenuIndex]);

    return (
        <aside className="sidebar" ref={sidebarRef}>
            <img
                src={frameIndex === 0 ? climbLeft : climbRight}
                alt="미어캣"
                className={`sidebar-mascot ${mascotPos.visible ? 'is-visible' : ''}`}
                style={{
                    transform: `translateY(${mascotPos.y}px)`
                }}
            />
            <button className="sidebar-logo" onClick={() => navigate('/main')} title="홈으로">
                <span className="logo-char">바</span>
                <span className="logo-char">르</span>
                <span className="logo-char">미</span>
                <img src={rmiRun} alt="바르미" className="sidebar-logo-image" />
            </button>

            <nav className="sidebar-nav">
                <ul className="nav-list" ref={navListRef}>
                    {fileteredMenuItems.map((item) => (
                        <li
                            key={item.name}
                            className="nav-item"
                            onMouseEnter={() => setHoveredMenu(item.name)}
                            onMouseLeave={() => setHoveredMenu(null)}
                        >
                            {item.subItems ? (
                                <div
                                    className={`nav-link ${isLearningSubActive && item.name === '학습하기' ? 'active' : ''}`}
                                    style={{ cursor: 'default' }}
                                >
                                    {item.name}
                                </div>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                >
                                    {item.name}
                                </Link>
                            )}
                            {item.subItems && (
                                item.name === '학습하기' && (hoveredMenu === item.name || isLearningSubActive)
                            ) && (
                                    <ul className="nav-submenu">
                                        {item.subItems.map((subItem) => (
                                            <li key={subItem.name}>
                                                <Link
                                                    to={subItem.path}
                                                    className={`nav-sublink ${location.pathname === subItem.path ? 'active' : ''}`}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                        </li>
                    ))}
                    <li className="nav-item" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <button
                            onClick={() => {
                                const email = localStorage.getItem('userEmail') || 'guest';
                                const role = localStorage.getItem('userRole') || 'USER';
                                localStorage.removeItem(`onboardingCompleted_${role}_${email}`); // 역할별 키 삭제
                                window.location.href = '/main'; // 튜토리얼 트리거 -> 메인으로 튕기면서 새로고침
                            }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#f5f0e6',
                                color: '#a67c00',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            튜토리얼
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;