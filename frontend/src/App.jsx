import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import MainLayout from './components/common/MainLayout';
import PronunciationPage from './components/pages/PronunciationPage';
import WordPage from './components/pages/WordPage';
import SentencePage from './components/pages/SentencePage';
import ConversationPage from './components/pages/ConversationPage';
import TutoringPage from './components/pages/TutoringPage';
import MainPage from './components/pages/MainPage';
import ProfilePage from './components/pages/ProfilePage';

function App() {
    return (
        <Router>
            <Routes>
                {/* 인증 관련 페이지 */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* 메인 서비스 페이지 - 공통 레이아웃 */}
                <Route element={<MainLayout />}>
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/pronunciation" element={<PronunciationPage />} />
                    <Route path="/word" element={<WordPage />} />
                    <Route path="/sentence" element={<SentencePage />} />
                    <Route path="/conversation" element={<ConversationPage />} />
                    <Route path="/tutoring" element={<TutoringPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
