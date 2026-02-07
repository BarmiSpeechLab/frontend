import React, { useEffect, useRef } from 'react';

const IntonationGraph = ({
    standardPitch = [],
    userPitch = [],
    standardSegments = [],
    userSegments = [],
    width = 800,
    height = 300
}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const drawGraph = () => {
            const ctx = canvas.getContext('2d');
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // 데이터가 없으면 리턴 (혹은 빈 캔버스)
            if ((!standardPitch || standardPitch.length === 0) && (!userPitch || userPitch.length === 0)) {
                return;
            }

            // 1. 상대 억양 정렬 (Relative Pitch Alignment)
            // 사용자 피치의 시작점을 표준 피치의 시작점과 맞춤
            let alignedUserPitch = [];
            let pitchOffset = 0;

            if (standardPitch.length > 0 && userPitch.length > 0) {
                // 0이 아닌 첫 번째 유효값 찾기
                const stdStart = standardPitch.find(v => v > 0);
                const userStart = userPitch.find(v => v > 0);

                if (stdStart && userStart) {
                    pitchOffset = stdStart - userStart;
                    alignedUserPitch = userPitch.map(v => (v > 0 ? v + pitchOffset : 0));
                } else {
                    alignedUserPitch = userPitch;
                }
            } else {
                alignedUserPitch = userPitch;
            }

            // 2. Y축 정규화 (스케일링)
            const allValues = [...(standardPitch || []), ...(alignedUserPitch || [])].filter(v => v > 0);

            // 데이터가 아예 없거나 전부 0이면 그리지 않음
            if (allValues.length === 0) return;

            const minVal = Math.min(...allValues) * 0.9;
            const maxVal = Math.max(...allValues) * 1.1;
            const range = maxVal - minVal || 1;

            const getY = (val) => {
                if (val <= 0) return canvasHeight;
                return canvasHeight - ((val - minVal) / range) * canvasHeight;
            };

            const drawLine = (data, color, isDashed = false) => {
                if (!data || data.length === 0) return;

                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                if (isDashed) ctx.setLineDash([5, 5]);
                else ctx.setLineDash([]);

                const stepX = canvasWidth / (data.length - 1 || 1);

                data.forEach((val, idx) => {
                    const x = idx * stepX;
                    const y = getY(val);

                    if (idx === 0) ctx.moveTo(x, y);
                    else {
                        // 중간에 0이 있으면 끊어서 그리기 (옵션)
                        // 여기서는 0이면 바닥으로 떨어지게 둠 (getY(0) == canvasHeight)
                        // 만약 끊고 싶다면 moveTo로 이동
                        if (val <= 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
                ctx.setLineDash([]);
            };

            // 표준 억양 (빨강)
            drawLine(standardPitch, '#e24a4aff');
            // 사용자 억양 (초록) - 보정된 데이터 사용
            drawLine(alignedUserPitch, '#00ff22ff');


            // 3. 단어/세그먼트 경계 표시 (문장일 경우)
            if (standardSegments && standardSegments.length > 0) {
                const totalLength = standardPitch.length || 1;
                let currentIdx = 0;

                ctx.font = 'bold 14px "Pretendard", sans-serif';
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;

                standardSegments.forEach((seg, idx) => {
                    const segLen = (seg.curve_pitch || []).length;
                    if (segLen === 0) return;

                    // 경계선 그리기 (마지막 세그먼트 제외)
                    if (idx < standardSegments.length - 1) {
                        const boundaryX = ((currentIdx + segLen) / totalLength) * canvasWidth;

                        ctx.beginPath();
                        ctx.moveTo(boundaryX, 0);
                        ctx.lineTo(boundaryX, canvasHeight);
                        ctx.setLineDash([4, 4]);
                        ctx.stroke();
                    }

                    // 단어 라벨 그리기
                    // 세그먼트의 중심 X 좌표 계산
                    const startX = (currentIdx / totalLength) * canvasWidth;
                    const endX = ((currentIdx + segLen) / totalLength) * canvasWidth;
                    const centerX = (startX + endX) / 2;

                    // 세그먼트에 텍스트 정보가 있다면 (없으면 pass)
                    const label = seg.word || seg.text || '';
                    if (label) {
                        ctx.fillText(label, centerX, canvasHeight - 10);
                    }

                    currentIdx += segLen;
                });
                ctx.setLineDash([]);
            }

        };

        drawGraph();
    }, [standardPitch, userPitch, standardSegments, width, height]);

    return (
        <div className="graph-card">
            <div className="graph-title">
                <span>억양 분석</span>
                <div style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                    <span style={{ color: '#e24a4aff', marginRight: '10px' }}>· 표준</span>
                    <span style={{ color: '#00ff22ff' }}>· 내 발음 (보정됨)</span>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ width: '100%', height: 'auto' }}
            />
        </div>
    );
};

export default IntonationGraph;
