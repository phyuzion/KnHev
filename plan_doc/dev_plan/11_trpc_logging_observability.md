## tRPC 로깅/관측성 설계

### 목표
- 어떤 프로시저가 언제 누가 어떤 입력으로 불렸고, 결과/에러/지연이 무엇인지 즉시 추적

### 코릴레이션/컨텍스트
- `requestId`: 헤더 `x-request-id` 없으면 uuid 생성 → `ctx.reqId`
- `userId`: 인증 미들웨어에서 `ctx.user?.id`
- `connId`: WebSocket 연결 식별자

### 로거
- Pino(JSON) 기본, 개발은 pretty, 프로덕션은 구조화 로그(Loki 수집)
- 레벨: debug/info/warn/error, 모듈 태그: `trpc`, `auth`, `db`
- 레드액션: `idToken`, `Authorization`, `password`, `jwt`, `apiKey`
- 페이로드 트렁케이션: 입력/출력 8KB 초과 시 잘라내고 `truncated:true`

### 미들웨어(요지)
```ts
trpc.middleware(async ({ path, type, next, ctx, rawInput }) => {
  const start = Date.now();
  try {
    const result = await next();
    logger.info({
      tag: 'trpc', reqId: ctx.reqId, userId: ctx.user?.id, connId: ctx.connId,
      path, type, durationMs: Date.now()-start,
      input: redact(rawInput),
      ok: true
    });
    return result;
  } catch (err) {
    const e = normalizeTrpcError(err);
    logger.error({
      tag: 'trpc', reqId: ctx.reqId, userId: ctx.user?.id, connId: ctx.connId,
      path, type, durationMs: Date.now()-start,
      input: redact(rawInput), error: { code: e.code, message: e.message }
    });
    throw err;
  }
});
```

### 메트릭(prom-client)
- `trpc_requests_total{path,type,code}` counter
- `trpc_duration_ms_bucket{path,type}` histogram(p50/p90/p99)
- `ws_connections_gauge` 현재 WS 연결 수

### 샘플링/레벨
- dev: `LOG_LEVEL=debug` 전량
- prod: 기본 info, 에러는 전체, 느린 요청(>1s)은 warn으로 별도 로깅

### 에러 표준화
- TRPCError → `{ code, message, reqId }` 노출, 내부 스택은 비노출

### 이벤트
- WS 연결/끊김 로그, 구독 시작/종료, 재접속 이벤트 기록
- 모든 이벤트에 `provider?`, `model?`, `pack_version?`(AI 관련 시) 필드 포함

### 이벤트 로그(상호작용/행동/감정)
- `interaction_event`: { reqId, userId, sessionId, ts, type, intensity?, position?, meta? }
- `character_action_event`: { reqId, sessionId, ts, action, params? }
- `emotion_event`: { reqId, sessionId, ts, label, intensity? }

샘플링
- dev: 100%
- prod: 상호작용 전량, 캐릭터 행동 전량, 감정 로그 50% 샘플(집계는 전량 DB 저장)

상관관계
- tRPC 요청 로그 ↔ 이벤트 로그를 `reqId` 또는 `sessionId`로 조인

### 전환 로그(환경/BGM)
- `env_transition`: { reqId, userId?, reason, from:{ preset?, track? }, to:{ preset?, track? }, durationMs, policy?: any }
- 규칙 위반: `env_guard_violation`: { reqId, rule, context }

### AI 로그
- `ai_intent`: { reqId, sessionId, userId?, inputs:{ signalRefs, textLen }, output:{ intent }, durationMs, provider, model, pack_version? }
- `ai_reply`: { reqId, sessionId, tokensIn, tokensOut, provider, model, pack_version?, safety:{ flagged }, durationMs }
- PII 최소화: 원문 텍스트 저장 금지(요약/토픽만), 필요시 해시/가명화

### AI 멀티에이전트 트레이싱
- `ai_trace`: { reqId, sessionId?, userId?, agents:[ { name, start, end, ok, tokensIn?, tokensOut?, model? } ], final:{ intent?, text? } }
- 각 에이전트 단계별 입력/출력 요약 저장(원문 금지), 에러는 코드/메시지/스택 해시만
- 슬로우 스팬 경고: >800ms 단계 warn, >2s error

### Bible/Knowledge 로그
- `bible_unit_change`: { actor, unit_id, fromStage, toStage, version, ts }
- `knowledge_pack_build`: { actor, bible_version, pack_id, durationMs, sizeKb }
- `ai_bible_pin`: { sessionId?, userId?, pack_id, version, ts }

### Skeleton 로그
- `skeleton_seed_use`: { actor, id_code, version, sessionId?, ts }
- `skeleton_draft_gen`: { actor:'ai'|'admin', base_id_code, draft_id, diffSize, durationMs }
- `skeleton_promote`: { actor, skeleton_id, fromStage, toStage, version, ts }

### Master/스케줄러 로그
- `ai_master_propose`: { draft_id, base_id_code, safety_score, rationale_len, durationMs }
- `ai_master_validate`: { draft_id, passed, checks, sim_uplift?, durationMs }
- `ai_master_shadow`: { draft_id, sample, win_rate }
- `ai_master_promote`: { draft_id, skeleton_id, version, mode }
- `scheduler_job`: { job_id, type, status, run_at, durationMs, error? }

### Autopilot 이벤트
- `ai_autopilot_toggle`: { actor:'system'|'admin', on:boolean, reason?, ts }
- `ai_guard_trip`: { rule, draft_id?, context, action:'block'|'downgrade'|'alert' }

(추가)
- 모든 `ai_*` 로그에 `provider`, `model`, `pack_version` 필드 포함
- 사고/회귀 분석을 위해 호출 해시, 프롬프트/출력 요약 길이, 토큰 사용량 기록
