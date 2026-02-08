import React, { useState, useEffect } from 'react';
import tunnelBase from '../../assets/img/tunnel_base.png';
import tutorialV2 from '../../assets/img/tutorial_v2.png';
import './OnboardingModal.css';
import { getUserProfile } from '../../api/user'; // Import API

const OnboardingModal = ({ onComplete, role = 'USER' }) => {
    // 'INTRO' (shaking) or 'TUTORIAL' (content)
    const [phase, setPhase] = useState('INTRO');
    const [step, setStep] = useState(1); // Start at Step 1

    // Nickname State Logic
    const [nickname, setNickname] = useState(() => {
        const stored = localStorage.getItem('userNickname');
        return (stored && stored !== 'undefined') ? stored : '사용자';
    });

    // Fetch nickname if it is '사용자' (fallback)
    useEffect(() => {
        if (nickname === '사용자') {
            const fetchNickname = async () => {
                try {
                    const profile = await getUserProfile();
                    // Check various possible locations of nickname
                    const realName = profile?.nickname || profile?.data?.nickname || profile?.nickName;
                    if (realName) {
                        setNickname(realName);
                        localStorage.setItem('userNickname', realName);
                    }
                } catch (error) {
                    console.error("Failed to fetch nickname in onboarding:", error);
                }
            };
            fetchNickname();
        }
    }, [nickname]);

    // Total steps logic
    const contentStepsCount = role === 'TUTOR' ? 5 : 7;
    const maxStep = contentStepsCount;

    // Intro Animation Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase('TUTORIAL');
        }, 2000); // 2 seconds shake
        return () => clearTimeout(timer);
    }, []);

    const nextStep = () => {
        if (step < maxStep) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const prevStep = () => {
        if (step > 1) { // Stop at Step 1
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    // ----- Content Rendering -----
    const renderContent = () => {
        // Logic for TUTOR Content
        if (role === 'TUTOR') {
            switch (step) {
                case 1:
                    return (
                        <div className="tutorial-text-container">
                            <h3>반가워요, {nickname} 튜터님!</h3>
                            <p>학생들의 영어 실력 향상을 도와주세요.<br />튜터님을 위한 기능들을 안내해 드릴게요.</p>
                        </div>
                    );
                case 2:
                    return (
                        <div className="tutorial-text-container">
                            <h3>학습 내용 관리</h3>
                            <p>학생의 학습 리포트를 확인하고<br />수업을 준비할 수 있어요.</p>
                        </div>
                    );
                case 3:
                    return (
                        <div className="tutorial-text-container">
                            <h3>화상 강의실 입장</h3>
                            <p>수업 시간이 되면<br />강의실에 입장할 수 있어요.</p>
                        </div>
                    );
                case 4:
                    return (
                        <div className="tutorial-text-container">
                            <h3>수업 및 피드백</h3>
                            <p>1:1 화상 수업을 진행하고<br />피드백을 제공하세요.</p>
                        </div>
                    );
                case 5:
                    return (
                        <div className="tutorial-text-container">
                            <h3>이제 시작해볼까요?</h3>
                            <p>학생들과 함께<br />즐거운 영어를 시작해보세요!</p>
                        </div>
                    );
                default: return null;
            }
        }

        // Logic for USER Content
        switch (step) {
            case 1:
                return (
                    <div className="tutorial-text-container">
                        <h3>반가워요, {nickname}님!</h3>
                        <p>바르미에 오신 걸 환영해요!<br />바르미의 기능들을 설명해드릴게요.</p>
                    </div>
                );
            case 2:
                return (
                    <div className="tutorial-text-container">
                        <h3>발음기호 학습</h3>
                        <p>정확한 입모양을 보고<br />발음 기호를 익혀보세요.</p>
                    </div>
                );
            case 3:
                return (
                    <div className="tutorial-text-container">
                        <h3>단어 학습</h3>
                        <p>레벨별 필수 단어를<br />입모양과 함께 연습해요.</p>
                    </div>
                );
            case 4:
                return (
                    <div className="tutorial-text-container">
                        <h3>문장 학습</h3>
                        <p>상황별 주요 문장을<br />자연스럽게 말해보세요.</p>
                    </div>
                );
            case 5:
                return (
                    <div className="tutorial-text-container">
                        <h3>실전 회화</h3>
                        <p>AI와 함께 다양한 주제로<br />회화 연습을 할 수 있어요.</p>
                    </div>
                );
            case 6:
                return (
                    <div className="tutorial-text-container">
                        <h3>1:1 튜터링</h3>
                        <p>전문 튜터와 함께<br />꼼꼼한 피드백을 받아보세요.</p>
                    </div>
                );
            case 7:
                return (
                    <div className="tutorial-text-container">
                        <h3>이제 시작해볼까요?</h3>
                        <p>꾸준함이 실력을 만들어요.<br />바르미와 함께 성장해보세요!</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="onboarding-container">
            {/* 1. Fixed Text Layer (Top Area) */}
            {phase === 'TUTORIAL' && (
                <div className="onboarding-text-layer fade-in">
                    {renderContent()}
                </div>
            )}

            {/* 2. Fixed Character Layer (Center/Bottom Area) */}
            <div className="onboarding-character-layer">
                {phase === 'INTRO' ? (
                    <img
                        src={tunnelBase}
                        alt="Tunnel"
                        className="character-img rub-animation"
                    />
                ) : (
                    <img
                        src={tutorialV2}
                        alt="Tutorial Character"
                        className="character-img fade-in"
                    />
                )}
            </div>

            {/* 3. Controls Layer (Arrows & Skip) */}
            {phase === 'TUTORIAL' && (
                <>
                    {step > 1 && (
                        <button className="nav-arrow left-arrow" onClick={prevStep}>
                            &#10094;
                        </button>
                    )}
                    <button className="nav-arrow right-arrow" onClick={nextStep}>
                        &#10095;
                    </button>

                    <div className="skip-btn-container">
                        <button className="skip-btn" onClick={handleSkip}>
                            건너뛰기
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default OnboardingModal;