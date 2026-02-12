import React, { useEffect, useRef } from 'react';

export default function UserVideoComponent({ streamManager }) {
    const videoRef = useRef();

    useEffect(() => {
        if (streamManager && videoRef.current) {
            streamManager.addVideoElement(videoRef.current);
        }
    }, [streamManager]);

    // 1. streamManager가 없으면 아예 아무것도 그리지 않음
    if (!streamManager) return null;

    // 2. 닉네임 가져오기 (안전하게 파싱)
    const getNicknameTag = () => {
        try {
            // connection.data가 문자열 형태의 JSON이라 파싱 필요
            const data = JSON.parse(streamManager.stream.connection.data);
            return data.clientData;
        } catch (error) {
            return 'Unknown';
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block', margin: '5px' }}>
            {streamManager ? (
                <video
                    autoPlay={true}
                    ref={videoRef}
                    style={{
                        width: '100%',
                        borderRadius: '10px',
                        transform: 'rotateY(180deg)',
                        backgroundColor: '#000'
                    }}
                />
            ) : null}

            {/* 닉네임 오버레이 */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                pointerEvents: 'none' // 마우스 클릭 방해 안 하게
            }}>
                {getNicknameTag()}
            </div>
        </div>
    );
}