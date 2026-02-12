import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // 모든 페이지 이동 시 스크롤 최상단으로 이동
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        // 새로고침 시 브라우저가 스크롤 위치를 기억하지 않도록 설정
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // 마운트 시에도 강제 이동
        window.scrollTo(0, 0);

        return () => {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'auto'; // 언마운트 시 복구 (선택 사항)
            }
        };
    }, []);

    return null;
};

export default ScrollToTop;
