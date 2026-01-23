import React from 'react';
import Sidebar from '../common/Sidebar';
import img6 from '../../assets/img/6.png';
import './MainPage.css';

const MainPage = () => {
    return (
        <div className="main-layout">
            <Sidebar />

            <main className="main-content">
                <img src={img6} alt="Main Content" style={{ maxWidth: '80%', height: 'auto' }} />
            </main>
        </div>
    );
};

export default MainPage;