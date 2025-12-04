# 🎓 Senior Software Developer's CPD

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://ssdcpd-react.web.app/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple?logo=vite)](https://vite.dev/)

**Continuing Professional Development (CPD) 포트폴리오 웹 애플리케이션**

시니어 개발자의 지속적인 학습과 성장을 보여주는 다국어 지원 포트폴리오 플랫폼입니다. Firebase Realtime Database와 연동하여 실시간으로 CPD 트랙을 관리하고, PWA 기능을 통해 모바일 환경에서도 최적화된 경험을 제공합니다.

🌐 **Live Demo**: [https://ssdcpd-react.web.app/](https://ssdcpd-react.web.app/)

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [환경 변수 설정](#-환경-변수-설정)
- [빌드 및 배포](#-빌드-및-배포)
- [주요 컴포넌트](#-주요-컴포넌트)
- [데이터 흐름](#-데이터-흐름)
- [디자인 시스템](#-디자인-시스템)
- [PWA 기능](#-pwa-기능)
- [라이선스](#-라이선스)

---

## ✨ 주요 기능

### 🌍 다국어 지원 (i18n)

- **영어(EN)** / **한국어(KO)** 실시간 전환
- Firebase Realtime Database에서 번역 데이터 동적 로드
- Context API 기반 전역 상태 관리
- 중첩된 번역 키 지원 (`t('hero.title')`)

### 🔥 Firebase 연동

- **Realtime Database**에서 CPD 트랙 데이터 실시간 로드
- 환경 변수를 통한 안전한 설정 관리
- TypeScript 타입 안전성 보장

### 🎯 트랙 필터링 시스템

- 카테고리별 필터: All, Systems/Shell, Scripting, Backend, C/C++
- 실시간 필터링 (클릭 시 즉시 반영)
- 각 트랙별 상세 정보 카드 표시

### 📱 반응형 디자인

- 모바일(768px 이하): 햄버거 메뉴
- 데스크톱: 전체 네비게이션 바
- 부드러운 애니메이션과 전환 효과

### 🚀 PWA (Progressive Web App)

- 오프라인 지원
- 홈 화면에 추가 가능
- 자동 업데이트 (Service Worker)
- 최적화된 캐싱 전략

### 🎨 모던 UI/UX

- 다크 테마 중심 디자인
- 글래스모피즘 효과
- 부드러운 애니메이션
- LG Smart 폰트 적용

---

## 🛠 기술 스택

### Frontend

- **React** 19.2.0 - UI 라이브러리
- **TypeScript** 5.9.3 - 타입 안전성
- **Vite** 7.2.4 - 빌드 도구 (빠른 HMR)

### Backend & Services

- **Firebase** 12.6.0
  - Realtime Database - 데이터 저장소
  - Hosting - 웹 호스팅

### State Management

- **React Context API** - 전역 상태 관리
  - I18nContext - 다국어 지원
  - TracksContext - 트랙 데이터 관리

### Styling

- **Vanilla CSS** - 커스텀 디자인 시스템
- LG Smart 폰트 (Light, Regular, SemiBold, Bold)

### PWA

- **vite-plugin-pwa** 1.2.0 - PWA 기능
- **Workbox** - Service Worker 관리

### Development Tools

- **ESLint** 9.39.1 - 코드 품질
- **TypeScript ESLint** 8.46.4 - TypeScript 린팅

---

## 📁 프로젝트 구조

```
ssdcpd-react/
├── public/                      # 정적 파일
│   ├── fonts/                   # LG Smart 폰트 (Light, Regular, SemiBold, Bold)
│   └── images/                  # 이미지 리소스
│       ├── favicon.ico          # 파비콘
│       ├── icon-192.png         # PWA 아이콘 (192x192)
│       ├── icon-512.png         # PWA 아이콘 (512x512)
│       └── thumbnail.png        # OG 이미지 (1200x630)
│
├── src/
│   ├── components/
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx       # 네비게이션 + 햄버거 메뉴 + 언어 토글
│   │   │   └── Footer.tsx       # 푸터
│   │   └── sections/            # 섹션 컴포넌트
│   │       ├── Hero.tsx         # 히어로 섹션
│   │       ├── TracksSection.tsx # 트랙 목록 + 필터
│   │       ├── TrackCard.tsx    # 개별 트랙 카드
│   │       ├── TimelineSection.tsx # 타임라인
│   │       └── AboutSection.tsx # 소개 섹션
│   │
│   ├── i18n/                    # 다국어 지원 시스템
│   │   ├── i18nContext.tsx      # Context 정의
│   │   ├── I18nProvider.tsx     # Provider (Firebase에서 번역 데이터 로드)
│   │   └── useI18n.ts           # Custom Hook
│   │
│   ├── tracks/                  # 트랙 관리 시스템
│   │   ├── TracksContext.tsx    # Context 정의
│   │   ├── TracksProvider.tsx   # Provider (Firebase에서 트랙 데이터 로드 + 필터링)
│   │   └── useTracks.ts         # Custom Hook
│   │
│   ├── services/                # Firebase 서비스
│   │   └── firebaseService.ts   # Firebase 초기화 + API 함수
│   │
│   ├── types_interfaces/        # TypeScript 타입 정의
│   │   ├── track.ts             # Track 타입
│   │   └── translations.ts      # Translation 타입
│   │
│   ├── App.tsx                  # 메인 앱 (Provider 래핑)
│   ├── main.tsx                 # 엔트리 포인트
│   ├── styles.css               # 글로벌 스타일 (11KB)
│   └── index.css                # 기본 리셋
│
├── .env                         # 환경 변수 (gitignore)
├── .firebaserc                  # Firebase 프로젝트 설정
├── firebase.json                # Firebase Hosting 설정
├── vite.config.ts               # Vite + PWA 설정
├── tsconfig.json                # TypeScript 설정
└── package.json                 # 의존성 관리
```

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 9.x 이상
- **Firebase 프로젝트** (Realtime Database 활성화)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/ssdcpd-react.git
cd ssdcpd-react

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

---

## 🔐 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 Firebase 설정을 추가하세요:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **주의**: `.env` 파일은 `.gitignore`에 포함되어 있습니다. 절대 Git에 커밋하지 마세요!

### Firebase Realtime Database 구조

```json
{
  "translations": {
    "en": {
      "nav": { "overview": "Overview", "tracks": "CPD Tracks", ... },
      "hero": { "title": "...", "subtitle": "...", ... },
      ...
    },
    "ko": {
      "nav": { "overview": "개요", "tracks": "CPD 트랙", ... },
      ...
    }
  },
  "tracks": {
    "track-id-1": {
      "title": "Shell Scripting Fundamentals",
      "category": "systems",
      "level": "Beginner",
      "status": "Active",
      "short": "Learn shell scripting basics...",
      "short_ko": "셸 스크립팅 기초 학습...",
      "url": "https://github.com/...",
      "tags": ["bash", "shell", "linux"]
    },
    ...
  }
}
```

---

## 📦 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 로컬 미리보기

```bash
npm run preview
```

### Firebase Hosting 배포

```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 배포
firebase deploy --only hosting:ssdcpd-react
```

배포 후 [https://ssdcpd-react.web.app/](https://ssdcpd-react.web.app/)에서 확인 가능합니다.

---

## 🧩 주요 컴포넌트

### App.tsx

최상위 컴포넌트로, `I18nProvider`와 `TracksProvider`로 전체 앱을 래핑합니다.

```tsx
<I18nProvider>
  <TracksProvider>
    <Header />
    <main>
      <Hero />
      <TracksSection />
      <TimelineSection />
      <AboutSection />
    </main>
    <Footer />
  </TracksProvider>
</I18nProvider>
```

### Header.tsx

- 고정 상단 네비게이션 (sticky)
- 햄버거 메뉴 (모바일)
- 언어 토글 버튼 (EN ↔ KO)
- 스크롤 시 부드러운 이동

### TracksSection.tsx

- 필터 칩 버튼 (All, Systems, Scripting, Backend, C/C++)
- `useTracks()` Hook으로 필터링된 트랙 가져오기
- `TrackCard` 컴포넌트로 각 트랙 렌더링

### TrackCard.tsx

- 개별 트랙 정보 표시
- 다국어 설명 지원 (`short` vs `short_ko`)
- GitHub 리포지토리 링크
- 태그 표시

### I18nProvider.tsx

- Firebase에서 번역 데이터 로드
- `getNestedValue()` 헬퍼로 중첩 키 접근
- `t()` 함수 제공

### TracksProvider.tsx

- Firebase에서 트랙 데이터 로드
- 필터링 로직 (`setFilter`)
- 로딩 상태 관리

---

## 🔄 데이터 흐름

```
Firebase Realtime Database
    ↓
firebaseService.ts
  ├─ getAllTranslations()
  └─ getAllTracks()
    ↓
Providers
  ├─ I18nProvider (번역 데이터)
  └─ TracksProvider (트랙 데이터 + 필터링)
    ↓
Context
  ├─ I18nContext
  └─ TracksContext
    ↓
Custom Hooks
  ├─ useI18n()
  └─ useTracks()
    ↓
Components
  ├─ Header (언어 토글)
  ├─ Hero (번역된 텍스트)
  ├─ TracksSection (필터 + 트랙 목록)
  └─ TrackCard (개별 트랙)
```

---

## 🎨 디자인 시스템

### 색상 팔레트

#### 다크 테마 (기본)

```css
--bg: #050816; /* 메인 배경 */
--bg-alt: #0b1020; /* 대체 배경 */
--card-bg: rgba(18, 24, 40, 0.9); /* 카드 배경 */
--primary: #22c55e; /* 그린 (강조) */
--accent: #38bdf8; /* 블루 (액센트) */
--text-main: #e5e7eb; /* 메인 텍스트 */
--text-muted: #9ca3af; /* 보조 텍스트 */
```

#### 라이트 테마

```css
--bg: #f8fafc;
--primary: #16a34a;
--text-main: #0f172a;
```

### 타이포그래피

- **폰트**: LG Smart (Light 300, Regular 400, SemiBold 600, Bold 700)
- **제목**: `clamp(2.4rem, 3.2vw + 1rem, 3.6rem)`
- **본문**: `0.95rem`

### UI 요소

- **Border Radius**: `18px` (카드), `999px` (버튼, 배지)
- **Shadow**: `0 18px 45px rgba(15, 23, 42, 0.75)`
- **Transition**: `0.15s ease` (호버 효과)

### 애니메이션

- **카드 호버**: `translateY(-3px)` + 그림자 증가
- **버튼 호버**: `translateY(-1px)` + 그림자 강화
- **글래스모피즘**: `backdrop-filter: blur(16px)`

---

## 📱 PWA 기능

### Manifest

- **이름**: Senior Software Developer's CPD
- **짧은 이름**: SSDCPD
- **테마 색상**: `#020617` (다크 블루)
- **표시 모드**: `standalone` (앱처럼 실행)

### Service Worker

- **자동 업데이트**: 새 버전 배포 시 자동 갱신
- **캐싱 전략**: Workbox 기반 최적화
- **오프라인 지원**: 정적 자산 캐싱

### 아이콘

- `icon-192.png` (192x192) - 홈 화면 아이콘
- `icon-512.png` (512x512) - 스플래시 화면

---

## 🔍 SEO 최적화

### Meta Tags

```html
<title>Senior Software Developer's CPD</title>
<meta
  name="description"
  content="Continuing Professional Development page..."
/>
```

### Open Graph (SNS 공유)

```html
<meta property="og:title" content="Senior Software Developer's CPD" />
<meta
  property="og:image"
  content="https://ssdcpd-react.web.app/images/thumbnail.png"
/>
<meta property="og:url" content="https://ssdcpd-react.web.app/" />
```

### Twitter Card

```html
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:image"
  content="https://ssdcpd-react.web.app/images/thumbnail.png"
/>
```

---

## 📜 스크립트

```json
{
  "dev": "vite", // 개발 서버 실행
  "build": "tsc -b && vite build", // TypeScript 컴파일 + 프로덕션 빌드
  "lint": "eslint .", // ESLint 검사
  "preview": "vite preview" // 빌드 결과 미리보기
}
```

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 개인 포트폴리오 목적으로 제작되었습니다.

---

## 👨‍💻 개발자

**Senior Software Developer**

- Website: [https://ssdcpd-react.web.app/](https://ssdcpd-react.web.app/)
- GitHub: [@GithubJoshuaPark](https://github.com/GithubJoshuaPark/ssdcpd-react)

---

## 🙏 감사의 말

- [React](https://react.dev/) - UI 라이브러리
- [Vite](https://vite.dev/) - 빌드 도구
- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [LG Smart Font](https://www.lge.co.kr/) - 타이포그래피

---

**Made with ❤️ by Senior Software Developer**
