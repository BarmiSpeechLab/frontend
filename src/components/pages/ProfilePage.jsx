import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubPage.css';
import './ProfilePage.css';
import { logout, withdraw } from '../../api/auth';
import { getUserProfile, getUserStats, updateUserProfile } from '../../api/user';

const ProfilePage = () => {
    const [user, setUser] = useState({
        nickname: '',
        email: '',
        joinDate: '',
    });
    const [stats, setStats] = useState({
        totalLearningTime: 0,
        completedLearning: 0,
        averageAccuracy: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedNickname, setEditedNickname] = useState('');
    const [profileImage, setProfileImage] = useState(null); // 미리보기
    // const [imageFile, setImageFile] = useState(null); // 연동 시 -> 실제 파일 객체 저장용
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            try {
                await logout();
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userEmail'); // 세션 정보 완전 삭제
                navigate('/login');
            } catch (err) {
                console.error("로그아웃 실패", err);
                alert("로그아웃 중 오류가 발생했습니다.");
            }
        }
    };

    const handleWithdraw = async () => {
        if (window.confirm('정말 탈퇴하시겠습니까?')) {
            try {
                await withdraw();

                localStorage.removeItem('accessToken');
                localStorage.removeItem('userEmail'); // 세션 정보 완전 삭제
                alert("회원 탈퇴가 완료되었습니다.");
                navigate('/login');
            } catch (err) {
                console.error("회원탈퇴 실패", err);
                alert(err.message || "회원 탈퇴 처리 중 오류가 발생했습니다.");
            }
        }
    };

    const handleEdit = () => {
        setEditedNickname(user.nickname);
        setIsEditing(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 크기 체크
            if (file.size > 2 * 1024 * 1024) {
                alert("이미지 크기는 2MB를 초과할 수 없습니다.");
                return;
            }

            // 나중에 연동 시 -> setImageFile(file); // 실제 파일 객체 저장
            const reader = new FileReader();
            // reader.onloadend = () => {
            //     setProfileImage(reader.result);
            // };
            // reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        if (isEditing) {
            fileInputRef.current.click();
        }
    };

    const handleSave = async () => {
        if (!editedNickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        try {
            await updateUserProfile({
                nickname: editedNickname,
                profileImage: null
            });

            setUser(prev => ({ ...prev, nickname: editedNickname }));
            setIsEditing(false);

            alert("프로필 정보가 수정되었습니다. (임시)");
        } catch (err) {
            console.error("프로필 수정 실패", err);
            alert(err.message || "프로필 수정 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. 프로필 조회
                const userData = await getUserProfile();

                setUser({
                    nickname: userData.nickname || '알 수 없음',
                    email: userData.email || 'unknown@example.com',
                    joinDate: userData.createdAt ? userData.createdAt.split('T')[0] : '2024-01-01',
                });

                // 2. 학습 현황 조회
                /*
                try {
                    const statsData = await getUserStats();
                    setStats({
                        totalLearningTime: statsData.totalTime || 0,
                        completedLearning: statsData.successCount || 0,
                        averageAccuracy: statsData.avgAccuracy || 0,
                    });
                } catch (e) {
                    console.warn("통계 정보를 가져오는데 실패했습니다", e);
                }
                */

            } catch (err) {
                console.error("프로필 로딩 실패", err);
                setError("프로필을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 시간 포맷팅용 함수
    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    if (loading) return <div className="profile-container">로딩 중...</div>;
    if (error) return <div className="profile-container">{error}</div>;

    return (
        <div className="profile-container">
            <h1 className="profile-title">프로필 수정</h1>
            <div className="profile-top-layout">
                {/* 기본 정보 */}
                <section className="profile-card basic-info">
                    <h2 className="card-title">기본 정보</h2>
                    <div className="info-content">
                        <div
                            className={`avatar-circle ${isEditing ? 'editable' : ''}`}
                            onClick={triggerFileInput}
                        >
                            {/* 이미지 수정 안 넣을 경우 없어도 됨 */}
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="avatar-img" />
                            ) : (
                                <span className="avatar-placeholder">{user.nickname?.charAt(0) || 'B'}</span>
                            )}
                            {isEditing && (
                                <div className="avatar-overlay">
                                    <span>변경</span>
                                </div>
                            )}
                        </div>
                        {/* 숨겨진 파일 인풋 */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <div className="info-fields">
                            <div className="field">
                                <label>닉네임</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={editedNickname}
                                        onChange={(e) => setEditedNickname(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="value">{user.nickname}</div>
                                )}
                            </div>
                            <div className="field">
                                <label>이메일</label>
                                <div className="value">{user.email}</div>
                            </div>
                            <div className="field">
                                <label>가입일</label>
                                <div className="value">{user.joinDate}</div>
                            </div>
                        </div>
                    </div>
                    <div className="button-group">
                        {isEditing ? (
                            <>
                                <button className="save-btn" onClick={handleSave}>저장</button>
                                <button className="cancel-btn" onClick={() => setIsEditing(false)}>취소</button>
                            </>
                        ) : (
                            <button className="edit-btn" onClick={handleEdit}>수정하기</button>
                        )}
                    </div>
                </section>

                {/* 학습 통계 */}
                <section className="profile-card stats-card">
                    <h2 className="card-title">학습 현황</h2>
                    <div className="stats-content">
                        <div className="main-stat">
                            {/* user_expression_stats의 학습 시간 합계 또는 로그 기반 계산 */}
                            <span className="stat-value highlight-blue">{formatTime(stats.totalLearningTime)}</span>
                            <span className="stat-label">총 학습 시간</span>
                        </div>
                        <div className="sub-stats">
                            <div className="sub-stat">
                                {/* user_expression_stats.success_count (완료한 학습) */}
                                <span className="sub-value">{stats.completedLearning}개</span>
                                <span className="sub-label">완료한 학습</span>
                            </div>
                            <div className="sub-stat">
                                {/* pronunciation_logs.accuracy_score 평균 */}
                                <span className="sub-value">{stats.averageAccuracy}%</span>
                                <span className="sub-label">평균 정확도</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 회원 탈퇴 */}
            <div style={{ marginTop: '3rem', textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', color: '#999', marginRight: '1rem' }}>혹시 ..</span>
                <button className="withdraw-btn" onClick={handleWithdraw} style={{ background: '#ddd', color: '#666' }}>회원 탈퇴</button>
            </div>
        </div>
    );
};

export default ProfilePage;