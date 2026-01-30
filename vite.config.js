// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 사용 중인 프레임워크에 따라 다를 수 있음

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'i14b104.p.ssafy.io' // 에러 메시지에 표시된 호스트 추가
    ],
    // 만약 어떤 호스트든 허용하고 싶다면 아래처럼 설정할 수도 있습니다.
    // allowedHosts: true 
  }
})