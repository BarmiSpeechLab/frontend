import React, { useEffect, useRef } from 'react';

const IntonationGraph = ({
    standardPitch = [],
    userPitch = [],
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

            // Y축 정규화
            const allValues = [...(standardPitch || []), ...(userPitch || [])].filter(v => v > 0);

            // 데이터가 아예 없거나 전부 0이면 그리지 않음
            if (allValues.length === 0) return;

            const minVal = Math.min(...allValues) * 0.9;
            const maxVal = Math.max(...allValues) * 1.1;
            const range = maxVal - minVal || 1;

            const getY = (val) => {
                if (val <= 0) return canvasHeight;
                return canvasHeight - ((val - minVal) / range) * canvasHeight;
            };

            const drawLine = (data, color) => {
                if (!data || data.length === 0) return;

                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const stepX = canvasWidth / (data.length - 1 || 1);

                data.forEach((val, idx) => {
                    const x = idx * stepX;
                    const y = getY(val);

                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            };

            // 표준 억양 (빨강)
            drawLine(standardPitch, '#e24a4aff');
            // 사용자 억양 (초록)
            drawLine(userPitch, '#00ff22ff');
        };

        drawGraph();
    }, [standardPitch, userPitch, width, height]);

    return (
        <div className="graph-card">
            <div className="graph-title">
                <span>억양 분석</span>
                <div style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                    <span style={{ color: '#e24a4aff', marginRight: '10px' }}>· 표준</span>
                    <span style={{ color: '#00ff22ff' }}>· 내 발음</span>
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
