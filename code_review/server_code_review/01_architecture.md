# 아키텍처/흐름

## 개요
- Fastify(v5) + tRPC 스타일 라우팅(HTTP) + SSE/WS 실시간 브로드캐스트
- MongoDB 연결, Firebase Admin 인증 검증, LLM 어댑터(Gemini 2.0 Flash)
- 모듈 단위 라우트 분리: `routes/*` + 공용 `realtime.ts`

## 요청 파이프라인
1) onRequest 훅: Firebase ID 토큰 검증(Bearer) → `req.user` 설정, 간단 로깅
2) preHandler 훅: 레이트리밋(메모리) 검사
3) 라우트 핸들러: zod 입력 검증 → 도메인 로직 → Mongo/R2/LLM 호출
4) onSend 훅: 응답 로깅(JSON 축약)

## 에이전트 상호작용(요약)
- ai.reply.generate: Safety(블록리스트/선호) 전처리 → LLM 생성 → ai_events 로깅
- ai.perception/director: 상태 요약/행동 결정
- ai.master.*: Autopilot(제안/검증/섀도/승격) → SSE/WS 방송

## 데이터/스토리지
- Mongo 컬렉션: sessions, dialogue_turns, ai_events, sel_evaluations, summaries, scheduler_tasks 등
- Cloudflare R2: presign 기반 업로드, 퍼블릭 도메인/CDN 노출

## 실시간
- SSE: `/events.master.proposals`, `/events/scheduler.jobs`
- WS: `/ws/master.proposals`, `/ws/scheduler.jobs`

## 보안
- Firebase Auth 검증, 쓰기 라우트 인증 가드 적용
- Safety 필터: 사용자별 blocklist/preferences 반영

## 확장
- MCP 브리지(에이전트-툴) 도입 예정
- LLM 공급자 전환(어댑터) 및 스켈레톤 집행 강결합 예정
