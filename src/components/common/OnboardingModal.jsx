import React, { useState } from 'react';
import rmiImg from '../../assets/img/tutorial.png';
import './OnboardingModal.css';

const OnboardingModal = ({ onComplete, role = 'USER' }) => {
    const [step, setStep] = useState(1);

    // 선생님 5단계 / 학생 7단계
    const totalSteps = role === 'TUTOR' ? 5 : 7;

    const nextStep = () => {
        if (step < totalSteps) setStep(step + 1);
        else onComplete();
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderTutorStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="onboarding-step">
                        <div className="mascot-container">
                            <img src={rmiImg} alt="Mascot" className="onboarding-mascot" />
                        </div>
                        <h2>튜터님 환영해요!</h2>
                        <p>바르미와 함께 학생들의 영어 실력 향상을 도와주세요.<br />튜터님을 위한 기능들을 안내해 드릴게요.</p>
                    </div>
                );
            case 2:
                return (
                    <div className="onboarding-step">
                        <h3>학습 내용 관리</h3>
                        <p className="feature-desc">학생의 학습 내용을 관리할 수 있어요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>학생의 학습 리포트를 확인할 수 있어요.</li>
                                <li>리포트를 토대로 수업을 준비해주세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="onboarding-step">
                        <h3>화상 강의실 입장</h3>
                        <p className="feature-desc">약속된 수업 시간이 되면 강의실에 입장할 수 있어요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>수업 시작 전에 '입장하기' 버튼이 활성화돼요.</li>
                                <li>카메라와 마이크 상태를 미리 점검해주세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="onboarding-step">
                        <h3>수업 및 피드백</h3>
                        <p className="feature-desc">1:1 화상 수업을 진행하고 학생에게 피드백을 제공하세요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>수업 전, 학생의 학습 리포트를 확인해주세요.</li>
                                <li>수업 종료 후 학생의 발음과 표현에 대한 피드백을 남겨주세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="onboarding-step">
                        <div className="mascot-container">
                            <img src={rmiImg} alt="Mascot" className="onboarding-mascot" />
                        </div>
                        <h3>준비 완료!</h3>
                        <p>이제 튜터로서 학생의 영어 실력 향상을 도와주세요.<br />바르미가 항상 응원하겠습니다!</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderUserStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="onboarding-step">
                        <div className="mascot-container">
                            <img src={rmiImg} alt="Mascot" className="onboarding-mascot" />
                        </div>
                        <h2>바르미에 오신 걸 환영해요!</h2>
                        <p>바르미는 영어 발음 및 회화 커리큘럼을 제공해요.<br />바르미의 기능들을 설명해드릴게요.</p>
                    </div>
                );
            case 2:
                return (
                    <div className="onboarding-step">
                        <h3>발음기호 학습</h3>
                        <p className="feature-desc">발음 기호를 익히고 내 발음을 교정받아보세요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>학습할 발음기호를 선택하세요.</li>
                                <li>입모양을 보고 따라 말해보세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="onboarding-step">
                        <h3>단어 학습</h3>
                        <p className="feature-desc">레벨별 필수 단어를 익혀보세요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>학습할 단어를 선택하세요.</li>
                                <li>입모양을 보고 따라 말해보세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="onboarding-step">
                        <h3>문장 학습</h3>
                        <p className="feature-desc">상황별 주요 문장을 자연스럽게 말해보세요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>학습할 문장을 선택하세요.</li>
                                <li>입모양을 보고 따라 말해보세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="onboarding-step">
                        <h3>실전 회화</h3>
                        <p className="feature-desc">다양한 시나리오로 AI와 함께 회화 실력을 키워보세요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>원하는 대화 주제를 선택하세요.</li>
                                <li>AI와 함께 회화 연습을 해보세요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="onboarding-step">
                        <h3>1:1 튜터링</h3>
                        <p className="feature-desc">튜터와 실시간 화상 통화로 꼼꼼한 피드백을 받을 수 있어요.</p>
                        <div className="usage-guide">
                            <h4>💡 이렇게 사용해요!</h4>
                            <ul>
                                <li>튜터 목록에서 원하는 튜터와 시간을 예약하세요.</li>
                                <li>예약된 시간에 '입장하기'를 눌러 화상통화를 시작해요.</li>
                            </ul>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="onboarding-step">
                        <h3>12주 학습 로드맵</h3>
                        <div className="roadmap-list">
                            <div className="roadmap-item">
                                <span className="level">Level 1</span>
                                <span className="desc">기초 발음 및 파닉스</span>
                            </div>
                            <div className="roadmap-item">
                                <span className="level">Level 2</span>
                                <span className="desc">중급 발음 및 실용 단어 응용</span>
                            </div>
                            <div className="roadmap-item">
                                <span className="level">Level 3</span>
                                <span className="desc">고급 문장 구조 및 실전 회화</span>
                            </div>
                        </div>
                        <p>바르미만의 커리큘럼으로 꾸준히 성장해보세요!</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <div className="onboarding-progress">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className={`progress-dot ${i + 1 === step ? 'active' : ''}`}></div>
                    ))}
                </div>

                <div className="onboarding-body">
                    {role === 'TUTOR' ? renderTutorStep() : renderUserStep()}
                </div>

                <div className="onboarding-footer">
                    {step > 1 && (
                        <button className="onboarding-btn secondary" onClick={prevStep}>이전</button>
                    )}
                    <button className="onboarding-btn primary" onClick={nextStep}>
                        {step === totalSteps ? (role === 'TUTOR' ? '시작하기' : '시작하기') : '다음'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;