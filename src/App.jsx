import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute'; // 로그인한 유저만 접근 가능하게 하기 위함
import PronunciationPage from './components/pages/PronunciationPage';
import WordPage from './components/pages/WordPage';
import SentencePage from './components/pages/SentencePage';
import ConversationPage from './components/pages/ConversationPage';
import TutoringPage from './components/pages/TutoringPage';
import TutoringLobby from './components/pages/TutoringLobby'; // 👈 이거 딱 한 줄 추가!
import MainPage from './components/pages/MainPage';
import ProfilePage from './components/pages/ProfilePage';

function App() {
    return (
        <Router>
            <Routes>
                {/* 1) 누구나 접근 가능 (인증 X) */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* 2) 로그인한 유저만 접근 가능 */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/main" element={<MainPage />} />
                        <Route path="/pronunciation" element={<PronunciationPage />} />
                        <Route path="/word" element={<WordPage />} />
                        <Route path="/sentence" element={<SentencePage />} />
                        <Route path="/conversation" element={<ConversationPage />} />
                        <Route path="/tutoring" element={<TutoringLobby />} />
                        <Route path="/tutoring/:roomId" element={<TutoringPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                </Route>

                {/* 그 외는 로그인 화면으로 튕기기 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;