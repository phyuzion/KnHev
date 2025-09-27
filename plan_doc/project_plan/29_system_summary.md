## 시스템 설계 요약(현재 합의안)

### 스택/런타임
- 클라이언트: React Native(WebView+Three.js), Admin: Next.js 15 + TS + Tailwind 4.1
- 서버: Node.js 20 + Fastify + tRPC v10(SSE/WS)
- 인증/분석: Firebase Auth(구글/애플), Firebase Analytics/Crashlytics
- 데이터/스토리지/CDN: MongoDB Atlas, Cloudflare R2/CDN
- LLM: 초기 Gemini 2.0 Flash(비용 최적) → 어댑터로 OpenAI/Llama 전환 가능

### 데이터 모델(뉴런형 메모리 그래프)
- 코어: users, sessions, dialogue_turns, audio_windows, session_summaries, daily_summaries, scenario_plays
- 정서/행동: emotions, user_metrics, interactions, character_actions, env_events
- AI/교육: ai_events, sel_evaluations, scheduler_tasks
- 스켈레톤/지식팩: coaching_skeletons, skeleton_drafts, sel_bible_units, knowledge_packs
- 시나리오/커리큘럼: scenarios, scenario_results, curriculum_units, curriculum_plans, curriculum_assignments

### API(tRPC) 주요 라우터
- 기본: auth, users, sessions, audio, dialogue, scene, character, content, storage.presign
- 기록/평가: metrics, actions, sel
- 시나리오/커리큘럼: scenarios.upsert/list, scenario.results.log, curriculum.units.upsert/list, curriculum.plans.upsert, curriculum.assignments.log
- 요약/이력: summaries
- 연출: env, bgm
- AI 멀티에이전트: ai.perception/coach/director/curator/scheduler/safety, ai.bible
- 스켈레톤/바이블 운영: skeleton.admin/ai.generate, bible.admin, knowledge.admin
- 마스터 AI(Autopilot): ai.master.propose/validate/shadowTest/promote
- 스케줄러/WS: scheduler.jobs.enqueue/status, ws.master.proposals, ws.scheduler.jobs

### 로깅/관측성
- 구조화 로그(Pino) + prom 메트릭, reqId/userId/connId 상관 키
- 민감정보 레드액션, 페이로드 트렁케이션
- 이벤트: 상호작용/행동/감정/환경전환/스켈레톤/바이블/지식팩/스케줄러
- AI 전용: `ai_traceId`, `provider`, `model`, `pack_version` 핀, `autopilot_phase`(propose|validate|shadow|promote), Autopilot 토글/가드 트립

### AI 설계(펫-컴패니언 철학 + MAGI 멀티에이전트)
- Perception(상태추정) → Coach(코칭) → Evaluator(SEL 채점) → Director(캐릭터/씬/BGM) → Curator(퀘스트/리추얼) → Scheduler → Safety
- 펫-컴패니언: 사용자를 "가르치지" 않고 더 멍청한 캐릭터로서 유도/반사/위로 중심 상호작용
- Knowledge Pack Lite: 페르소나/스타일/세이프티/루브릭/행동매핑·유닛 요약만 고정, 나머지는 LLM 즉시 합성
- Autopilot: 제안→검증→섀도우→승격(저위험 자동, 고위험 승인)

### 환경·BGM 동기화
- need × regulation × timePhase × weather 매트릭스 → 씬 프리셋 + 클래식 BGM 선택/크로스페이드
- need: calm|sleep|focus|mood_lift|grounding, regulation: downregulate|stabilize|upregulate
- 분노 증폭 금지, 저자극 전환 가드

### 시드/초기 자산
- 스켈레톤: BASE_SKEL_V1 + L1 파생(공감/경계/도움요청)
- 루브릭/스타일/세이프티/페르소나/행동매핑, 지식팩 템플릿
- 추가 예정: env_presets, 클래식 BGM 메타 시드, 초기 시나리오 샘플

### 재가동/영속성
- 불변 레이어 핀(persona/style/safety/rubric/action_mapping/pack)
- warm-start memory.brief(최근 요약/평가/사용 스켈레톤) 선주입
- 버전 핀/롤백/요약 롤업 잡, 큐잉·재시도
