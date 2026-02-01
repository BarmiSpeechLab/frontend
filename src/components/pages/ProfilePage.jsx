import React from 'react';
import './SubPage.css';

const ProfilePage = () => {
    return (
        <div className="profile-container">
            <h1 className="profile-title">프로필 수정</h1>

            <div className="profile-top-layout">
                {/* 기본 정보 섹션 */}
                <section className="profile-card basic-info">
                    <h2 className="card-title">기본 정보</h2>
                    <div className="info-content">
                        <div className="avatar-circle">바</div>
                        <div className="info-fields">
                            <div className="field">
                                <label>닉네임</label>
                                <div className="value">바르미1</div>
                            </div>
                            <div className="field">
                                <label>이메일</label>
                                <div className="value">barmi@example.com</div>
                            </div>
                            <div className="field">
                                <label>가입일</label>
                                <div className="value">!!</div>
                            </div>
                        </div>
                    </div>
                    <div className="button-group">
                        <button className="edit-btn">수정</button>
                        <button className="withdraw-btn">탈퇴</button>
                    </div>
                </section>

                {/* 학습 통계 섹션 */}
                <section className="profile-card stats-card">
                    <h2 className="card-title">학습 통계</h2>
                    <div className="stats-content">
                        <div className="main-stat">
                            <span className="stat-value highlight-blue">-</span>
                            <span className="stat-label">총 학습 시간</span>
                        </div>
                        <div className="sub-stats">
                            <div className="sub-stat">
                                <span className="sub-value">-</span>
                                <span className="sub-label">완료한 학습</span>
                            </div>
                            <div className="sub-stat">
                                <span className="sub-value">-</span>
                                <span className="sub-label">평균 정확도?</span>
                            </div>
                        </div>

                    </div>
                </section>
            </div>

            {/* 계정 관리 섹션 */}
            <section className="profile-card account-management">
                <h2 className="card-title">계정 관리</h2>
                <div className="management-list">
                    <div className="management-item">비밀번호 변경</div>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;
