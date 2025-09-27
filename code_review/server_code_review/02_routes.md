# 라우트/도메인별 API

## auth
- POST `/trpc/auth.verify` → Firebase ID 토큰 검증
- GET `/trpc/auth.getSession` → 세션 정보

## ai
- POST `/trpc/ai.reply.generate` → Safety 전처리 + LLM 응답
- POST `/trpc/ai.perception.summarize`, `/trpc/ai.director.decideActions`
- POST `/trpc/ai.master.propose|validate|shadowTest|promote` (인증 가드)

## bible/knowledge/skeletons
- POST `/trpc/bible.units.upsert`, GET `/trpc/bible.units.get|list`
- POST `/trpc/knowledge.packs.upsert`, GET `/trpc/knowledge.packs.list`
- POST `/trpc/skeletons.upsert`, GET `/trpc/skeletons.list`

## scenarios
- POST `/trpc/scenarios.upsert` (인증 가드)
- GET `/trpc/scenarios.list`
- POST `/trpc/scenario.results.log` (인증 가드)

## curriculum
- POST `/trpc/curriculum.units.upsert` (인증 가드)
- GET `/trpc/curriculum.units.list`
- POST `/trpc/curriculum.plans.upsert` (인증 가드)
- POST `/trpc/curriculum.assignments.log` (인증 가드)

## sessions/dialogue
- POST `/trpc/sessions.create|end` (인증 가드)
- POST `/trpc/dialogue.sendUserText`

## observations/evaluations
- POST `/trpc/ai.events.log` (zod), GET `/trpc/ai.events.list`(필터/커서)
- POST `/trpc/sel.evaluations.upsert`

## summaries/search
- POST `/trpc/summaries.session.upsert`, `/trpc/summaries.daily.upsert`
- GET `/trpc/history.search`

## metrics/interactions/audio
- POST `/trpc/audio.pushClientStats`, `/trpc/metrics.upsertUserMetric`, `/trpc/interactions.log`

## env/bgm
- POST `/trpc/env.getPreset`, `/trpc/bgm.tracks.pick`

## scheduler
- POST `/trpc/scheduler.jobs.enqueue`(인증 가드), GET `/trpc/scheduler.jobs.list`

## storage
- POST `/trpc/storage.presign`(인증 가드) → R2 업로드 URL/퍼블릭 URL 반환

## 실시간
- SSE: `/events.master.proposals`, `/events/scheduler.jobs`
- WS: `/ws/master.proposals`, `/ws/scheduler.jobs`
