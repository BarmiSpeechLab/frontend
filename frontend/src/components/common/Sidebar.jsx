import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();

    // 메뉴
    const menuItems = [
        { name: '홈', path: '/main' },
        { name: '발음기호', path: '/pronunciation' },
        { name: '단어', path: '/word' },
        { name: '문장', path: '/sentence' },
        { name: '회화', path: '/conversation' },
        { name: '튜터링', path: '/tutoring' },
        { name: '프로필', path: '/profile' },
    ];

    return (
        <aside className="sidebar">
            {/* 로고 */}
            <div className="sidebar-logo">
                <span className="logo-char">바</span>
                <span className="logo-char">르</span>
                <span className="logo-char">미</span>
            </div>

            {/* 메뉴 */}
            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {menuItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <Link
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;