import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();

    const userRole = localStorage.getItem('userRole') || 'USER';

    const allmenuItems = [
        { name: '홈', path: '/main', roles: ['USER', 'TUTOR'] },
        { name: '발음기호', path: '/pronunciation', roles: ['USER'] },
        { name: '학습하기', path: '/learning', roles: ['USER'] },
        { name: '회화 연습', path: '/conversation', roles: ['USER'] },
        { name: '튜터링', path: '/tutoring', roles: ['USER', 'TUTOR'] },
        { name: '일정 관리', path: '/schedule', roles: ['TUTOR'] },
        { name: '튜티 관리', path: '/report', roles: ['TUTOR'] },
        { name: '프로필', path: '/profile', roles: ['USER', 'TUTOR'] },
    ];

    const fileteredMenuItems = allmenuItems.filter(item => item.roles.includes(userRole));

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-char">바</span>
                <span className="logo-char">르</span>
                <span className="logo-char">미</span>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {fileteredMenuItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <Link
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.name}
                            </Link>
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