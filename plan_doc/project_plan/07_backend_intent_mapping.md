## 백엔드 실시간/의도 매핑

### 라우터 개념
- scene.setup/update
- audio.streamClientStats.subscribe — 클라 요약 수신
- dialogue.streamIntent.subscribe — 의도 지시 스트림
- character.spawn/control/follow
- admin.* — 자산/포인트/로그/리스크

### 인프라
- Node.js 20 + Fastify + tRPC v10(WS)
- DB: MongoDB(Atlas) + Mongoose(또는 Prisma Mongo)
- 스토리지: Cloudflare R2(S3 호환), CDN: Cloudflare
- 내부 AI 오케스트레이션: MCP 툴 호출로 에이전트 상호작용

### 의도 판단
- 입력: SER 요약 + (옵션) ASR + 사용자 컨텍스트
- LLM + 규칙(가중/임계) → intent/expr/anim/target/fx
- 연동: 환경/BGM 엔진과 동기화, 가드/쿨다운 준수

### 세이프티
- 키워드/톤 급변/무음 급증 + 분류기 → 즉시 risk.flag
- 사용자 고지/옵션 제시, 관리자 알림, 로깅
