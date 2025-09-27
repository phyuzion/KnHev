## 환경 변수 / 시크릿 구성 가이드

TL;DR
- 민감 키는 절대 코드/`.env.example`에 실제 값 넣지 않기
- 빌드 타임 노출 변수는 `NEXT_PUBLIC_`/`EXPO_PUBLIC_` 접두사 사용(민감값 금지)
- 로컬은 `.env.local`(개별 개발자), 서버는 시크릿 매니저/CI 변수 사용

### 공통(Common)
- `NODE_ENV`, `LOG_LEVEL`, `SENTRY_DSN`, `POSTHOG_API_KEY`(선택)
- `MONGODB_URI`
- Firebase(Web/Native)
  - 웹/어드민: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
  - 네이티브(RN): `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`, `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- tRPC: `TRPC_HTTP_URL`, `TRPC_WS_URL`
- R2(프리-릴리즈 단계부터 유효): `R2_ENDPOINT`, `R2_REGION`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `JWT_SECRET`, `LLM_PROVIDER`, `LLM_API_KEY`

### 주의
- 도메인/Cloudflare 관련 변수는 프리-릴리즈 체크리스트에서 활성화

### 서버(Server)
- `PORT`, `HOST`, `RATE_LIMIT_RPM`, `SAFETY_THRESHOLD_SELF_HARM`, `PRESIGNED_URL_TTL_SEC`

예시: `/server/.env`
```ini
NODE_ENV=development
LOG_LEVEL=info
TRPC_HTTP_URL=http://localhost:8787/trpc
TRPC_WS_URL=ws://localhost:8787/trpc
MONGODB_URI=mongodb+srv://user:pass@cluster/db
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
R2_REGION=auto
R2_BUCKET=khd-assets-dev
R2_ACCESS_KEY_ID=dev
R2_SECRET_ACCESS_KEY=dev
JWT_SECRET=change_me
LLM_PROVIDER=openai
LLM_API_KEY=sk-xxxx
PORT=8787
HOST=0.0.0.0
```

### 모바일 클라이언트(React Native)
- `EXPO_PUBLIC_TRPC_HTTP_URL`, `EXPO_PUBLIC_TRPC_WS_URL`
- `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`
- `APP_FEATURE_FLAGS`

### 어드민(Next.js 15)
- `NEXT_PUBLIC_TRPC_HTTP_URL`
- `NEXT_PUBLIC_CDN_BASE_URL`
- 서버 런타임 전용: `ADMIN_SESSION_SECRET`, `R2_*`, `MONGODB_URI`

### 푸시 인증서/키
- APNs/FCM 관련 키(보관은 시크릿 매니저)

### 보안 수칙/체크리스트
- [ ] 노출 접두사 점검, 시크릿 스캔, 키 로테이션 SOP

(추가)
- `LLM_PROVIDER` = openai|anthropic|google|azure|llama
- `LLM_MODEL` = gpt-4o-mini|gemini-1.5-pro|claude-3.5-sonnet|llama-3.1-70b 등
- `LLAMA_ENDPOINT` = http(s)://host:port (self-host 시)
- 모든 호출 로그에 provider/model/pack_version을 기록하여 재현성 확보

### MCP(내부 AI 오케스트레이션)
- `MCP_AUTH_TOKEN` = 내부 MCP 클라이언트 인증 토큰(스코프 제한)
