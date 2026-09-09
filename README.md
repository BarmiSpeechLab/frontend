# Barmi Frontend Developer Guide

## 아키텍처 및 디렉토리 구조 (Architecture)

프로젝트는 기능 단위(Feature-based)가 아닌 **계층 단위(Layer-based)**로 구조화되어 있으며, 각 디렉토리는 명확한 역할을 가집니다.

```
frontend/src/
├── api/             # API 통신 계층 (Axios 인스턴스 및 엔드포인트 정의)
├── assets/          # 정적 자원 (이미지, 폰트, 글로벌 스타일)
├── components/      # UI 컴포넌트
│   ├── auth/        # 인증 관련 (Login, Signup - 모달 및 폼 처리)
│   ├── common/      # 재사용 가능한 UI (Header, Sidebar, Charts, Modals)
│   └── pages/       # 라우트 단위 페이지 (비즈니스 로직 포함)
├── hooks/           # 커스텀 훅 (비즈니스 로직 및 UI 로직 분리)
├── utils/           # 순수 함수 및 유틸리티 (오디오 변환, 포맷팅)
└── App.jsx          # 라우터 설정 및 전역 레이아웃 구성
```

---

## 주요 구현 내용 (Key Implementations)

### 1. 오디오 처리 및 변환 (`utils/audioConverter.js`)
브라우저의 `MediaRecorder` API는 주로 WebM 형식을 지원하지만, AI 모델 호환성을 위해 **WAV (PCM 16bit)** 포맷으로 변환이 필요합니다.
- **AudioContext 활용**: WebM Blob을 `ArrayBuffer`로 변환 후 `decodeAudioData`를 통해 PCM 데이터를 추출합니다.
- **WAV 인코딩**: 추출된 PCM 데이터를 기반으로 WAV 헤더(RIFF, fmt, data 청크)를 직접 작성하여 16bit, 단일/다중 채널 WAV 파일을 생성합니다.

### 2. 스크롤 애니메이션 훅 (`hooks/useScrollAnimation.js`)
페이지 스크롤 시 요소들이 순차적으로 나타나는 효과를 위해 `IntersectionObserver` API를 캡슐화한 커스텀 훅을 구현했습니다.
- **동작 원리**: 
  1. `ref`가 할당된 컨테이너 내의 `.anim-target` 클래스를 가진 모든 자식 요소를 관찰합니다.
  2. 요소가 화면(Viewport)에 10% 이상 진입(`threshold: 0.1`)하면 `visible` 클래스를 추가하여 CSS 애니메이션을 트리거합니다.
- **최적화**: 컴포넌트 언마운트 시 `observer.disconnect()`를 호출하여 메모리 누수를 방지합니다.

### 3. 발음 연습 페이지 로직 (`PronunciationPracticePage.jsx`)
발음 연습 기능은 다음과 같은 복합적인 로직을 처리합니다.
- **상태 관리**: `useState`와 `useRef`를 사용하여 녹음 상태(`isRecording`), 오디오 데이터 청크(`audioChunksRef`), 캔버스 스트림 등을 관리합니다.
- **실시간 피드백**: 
  - 녹음 시작 시 `navigator.mediaDevices.getUserMedia`로 마이크 권한을 획득하고 스트림을 생성합니다.
  - 녹음 종료 시 `convertWebMToWav` 유틸리티를 호출하여 변환된 오디오를 백엔드로 전송합니다.
- **폴링(Polling) 매커니즘**: 
  - AI 분석 요청 후 `submitPronunciation` API가 `taskId`를 반환하면, `checkAnalysisStatus` API를 주기적으로 호출(2초 간격)하여 분석 완료 여부를 확인합니다.
  - `exponential backoff` 전략을 적용하거나 최대 재시도 횟수를 두어 서버 부하를 관리합니다.

### 4. 시각화 및 차트 (`components/common/`)
- **IntonationGraph.jsx**: HTML5 `Canvas` API를 사용하여 원어민의 피치(표준)와 사용자의 피치(녹음)를 겹쳐 그립니다. 좌표 계산 및 스케일링 로직을 포함하여 두 곡선을 직관적으로 비교할 수 있습니다.
- **WeeklyChart.jsx**: 순수 CSS와 `div` 요소를 활용하여 반응형 막대 그래프를 구현했습니다. 데이터 값에 따라 높이(`height%`)와 색상 강도(`intense-x` 클래스)를 동적으로 할당합니다.

### 5. UI/UX 디자인 시스템 (Glassmorphism)
- **CSS 구조**: 각 페이지 별 CSS 파일(`PronunciationPage.css`, `ReportPage.css`)에서 스타일을 관리하지만, 공통적인 Glassmorphism 효과는 일관된 패턴을 따릅니다.
- **Glass Effect 구현**:
  ```css
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  ```

### 6. 데이터 정규화 및 인코딩 처리 (Encoding & Normalization)
백엔드 연동 과정에서 발생한 한글 깨짐 현상(Encoding Issue)을 프론트엔드 레벨에서 매핑하여 해결했습니다.
- **문제 상황**: 일부 API 응답(예: 취약점 분석 결과)에서 한글 키값이 `ë§ˆì°°ìŒ`와 같이 깨져서 들어오는 현상 발생 (ISO-8859-1 vs UTF-8 불일치 추정).
- **해결 방안 (`ReportPage.jsx`)**: 
  - `koreanKeyMap` 객체를 정의하여 깨진 문자열을 올바른 한글 카테고리(마찰음, 파열음 등)로 복구하는 로직을 구현했습니다.
  - 정규화된 키를 기반으로 `TYPE_TO_CATEGORY` 매핑을 수행하여 일관된 데이터를 렌더링합니다.
  ```javascript
  const koreanKeyMap = {
      'ë§ˆì°°ìŒ': '마찰음',
      'íŒŒì—­ìŒ': '파열음',
      // ...
  };
  ```

---

## API 통신 전략 (`api/`)
- **Axios 인스턴스**: `axios.create()`를 사용하여 기본 URL 및 타임아웃을 설정한 인스턴스를 생성해 사용합니다.
- **모듈화**: 기능별로 파일을 분리하여 관리합니다.
  - `auth.js`: 로그인, 회원가입 관련 (JWT 토큰 처리)
  - `ai.js`: 음성 파일 전송 (`multipart/form-data`), 분석 결과 조회
  - `user.js`: 마이페이지, 리포트 데이터 조회
- **비동기 처리**: 모든 API 호출은 `async/await` 문법을 사용하여 가독성을 높이고 에러 핸들링(`try-catch`)을 수행합니다.

---

## 주요 라이브러리 (Dependencies)
- **react-router-dom**: SPA(Single Page Application) 라우팅 처리 (`useNavigate`, `useLocation` 훅 활용)
- **zustand**: 전역 상태 관리 (필요 시 도입, 현재는 로컬 상태 위주)
- **lucide-react**: 경량화된 아이콘 라이브러리 사용
- **openvidu-browser**: WebRTC 화상 튜터링 세션 연결 및 관리
