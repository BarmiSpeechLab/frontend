import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute'; // 로그인한 유저만 접근 가능하게 하기 위함
import PronunciationPage from './components/pages/PronunciationPage';
import PronunciationPracticePage from './components/pages/PronunciationPracticePage';
import PronunciationResultPage from './components/pages/PronunciationResultPage';
import LearningPage from './components/pages/LearningPage';
import LearningTopicPage from './components/pages/LearningTopicPage';
import LearningPracticePage from './components/pages/LearningPracticePage';
import LearningResultPage from './components/pages/LearningResultPage';
import TutoringPage from './components/pages/TutoringPage';
import TutoringLobby from './components/pages/TutoringLobby';
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
                        <Route path="/pronunciationPractice" element={<PronunciationPracticePage />} />
                        <Route path="/pronunciationResult" element={<PronunciationResultPage />} />
                        <Route path="/learning" element={<LearningPage />} />
                        <Route path="/learning/topic" element={<LearningTopicPage />} />
                        <Route path="/learning/practice" element={<LearningPracticePage />} />
                        <Route path="/learning/result" element={<LearningResultPage />} />
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