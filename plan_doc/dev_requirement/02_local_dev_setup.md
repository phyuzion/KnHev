## 로컬 개발 환경 설정

### 전제
- Node.js 20+, pnpm/npm, iOS/Android SDK, Xcode/Android Studio
- Postgres/Redis/S3(로컬 또는 매니지드), `.env` 준비

### 공통 단계
1) 의존성 설치: `pnpm i` (또는 `npm i`)
2) 환경 변수: `/server/.env`, `/client/.env`, `/admin/.env` 채우기
3) 로컬 서비스: Postgres/Redis/S3(Minio) 실행

### 서버
- 실행: `pnpm --filter server dev`
- 트랜스포트: tRPC HTTP/WS 확인

### 클라이언트(RN)
- iOS: `pnpm --filter client ios`
- Android: `pnpm --filter client android`
- WebView URL, 권한 설정 확인

### 어드민(Next.js)
- 실행: `pnpm --filter admin dev`

### 점검
- 헬스체크 엔드포인트, WS 연결, 로그 레벨
