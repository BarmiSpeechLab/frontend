// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 사용 중인 프레임워크에 따라 다를 수 있음

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process': {env: {}}
  },
  server: {
    host: true,
    port: 3000,
    // allowedHosts: [
    //   'i14b104.p.ssafy.io' // 에러 메시지에 표시된 호스트 추가
    // ],
    // // 만약 어떤 호스트든 허용하고 싶다면 아래처럼 설정할 수도 있습니다.
    allowedHosts: true,
    // 프록시 추가
    proxy: {
      '/api': {
        target: 'http://backend:8080', // 백엔드 서버 주소 (포트 확인 필수!)
        changeOrigin: true, // 호스트 헤더 변경 (CORS 문제 방지용)
        secure: false,      // https가 아닌 http 통신일 경우 false
        // rewrite: (path) => path.replace(/^\/api/, '') // 만약 백엔드 url에 /api가 없다면 주석 해제
      }
    }
  }
  
})