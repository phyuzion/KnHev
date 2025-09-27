## tRPC API 설계 스펙 (v1)

(노트) ai.master.* 엔드포인트는 에이전트가 자율 호출(크론/WS 트리거)하여 사람이 없는 상태에서도 제안→검증→섀도우→승격을 수행할 수 있다. 위험도에 따라 promoteDraft는 자동/수동 모드 선택.

(참고) 내부 AI 오케스트레이션은 **MCP(Model Context Protocol)**를 사용하며, 동등 기능의 MCP 툴을 제공한다. 세부: `project_plan/30_mcp_architecture.md`

### skeleton
- admin.upsert(input:{ skeleton:any }) → { id:string, version:string }
- admin.list(input:{ stage?:string; cursor?:string; limit?:number }) → { items:any[]; nextCursor?:string }
- admin.promote(input:{ id:string; toStage:'alpha'|'beta'|'prod' }) → { ok:true }
- ai.generate(input:{ base_id_code:string; goal:string; level:1|2|3; tone?:string; length?:'short'|'normal'; guards?:string[] }) → { draft_id:string }
- ai.pick(input:{ state:any; history?:any }) → { skeleton_id:string }

### 공통 원칙
- 인증: Firebase ID 토큰(베어러) → 서버에서 검증 후 `ctx.user` 주입
- 입력 검증: zod 스키마 필수, 페이로드 최대 256KB(대용량은 R2 프리사인)
- 식별자: `_id`(Mongo ObjectId string), ISO8601 UTC 타임스탬프
- 페이징: 커서 기반 `{ items, nextCursor? }`
- 스트리밍: 3–5s 요약은 mutation(push), 의도는 subscription(publish)

### 네임스페이스/프로시저

#### auth
- loginWithFirebaseToken(input: `{ idToken: string }`) → `{ userId, sessionId }`
- getSession() → `{ userId, email?, roles: string[] }`
- logout() → `{ ok: true }`

#### users
- getMe() → `User`
- updateProfile(input: `{ displayName?: string; locale?: 'ko'|'en'; preferences?: Record<string,any> }`) → `User`
- list(input: `{ q?: string; limit?: number; cursor?: string }`) → `{ items: User[]; nextCursor?: string }`

`type User = { _id: string; email?: string; locale?: 'ko'|'en'; profile?: any; consent_flags?: any; created_at: string }`

#### sessions
- create(input: `{ device_info?: any }`) → `Session`
- end(input: `{ sessionId: string }`) → `{ ok: true }`
- get(input: `{ sessionId: string }`) → `Session`
- listByUser(input: `{ userId?: string; limit?: number; cursor?: string }`) → `{ items: Session[]; nextCursor?: string }`

`type Session = { _id: string; user_id: string; device_info?: any; t_start: string; t_end?: string; notes?: string }`

#### audio
- pushClientStats(input: `AudioStatsPacket & { sessionId: string; window_id: string }`) → `{ ok: true }`

`type AudioStatsPacket = { ts: string; pitch_mean?: number; pitch_var?: number; energy_mean?: number; energy_var?: number; mfcc32_stats?: number[]; speech_rate?: number; vad_ratio?: number; ser_label?: 'happy'|'sad'|'angry'|'surprised'|'anxious'|'neutral'; ser_conf?: number; risk_score?: number }`

#### dialogue
- sendUserText(input: `{ sessionId: string; text: string }`) → `{ turnId: string }`
- streamIntent.subscribe(input: `{ sessionId: string }`) ⇒ server→client events: `IntentEvent`

`type IntentEvent = { intent: 'approach_slow'|'step_back'|'comfort_pose'|'surprise_jump'|'land_on_rock'|'peek_from_rock'; expr?: 'happy'|'sad'|'angry'|'surprised'|'neutral'|'concern'; anim?: string; target?: string; fx?: any; params?: any; ts: string }`

#### scene
- setup(input: `{ sceneId?: string; preset?: 'spring'|'summer'|'autumn'|'winter' }`) → `SceneConfig`
- update(input: `{ sceneId: string; changes: Partial<SceneConfig> }`) → `SceneConfig`
- getConfig(input: `{ sceneId: string }`) → `SceneConfig`

`type SceneConfig = { _id: string; background_asset_id?: string; weather?: any; points?: Point[]; props?: any[]; version?: string; stage?: 'dev'|'alpha'|'beta'|'prod' }`
`type Point = { name: string; type: 'appear'|'seat'|'fly'|'land'|'hide'|'pathNode'; position: [number,number,number]; rotation?: [number,number,number]; radius?: number; meta?: any }`

#### character
- spawn(input: `{ species: string; at?: string }`) → `{ id: string }`
- control(input: `{ id: string; cmd: 'go_to'|'anim'|'expr'; params: any }`) → `{ ok: true }`
- follow(input: `{ id: string; enable: boolean }`) → `{ ok: true }`

#### content
- catalog.list(input: `{ filter?: any; limit?: number; cursor?: string }`) → `{ items: Content[]; nextCursor?: string }`
- recipe.select(input: `{ state: { need: 'calm'|'sleep'|'focus'|'mood_lift'|'grounding'; level: 1|2|3; risk?: number }; time_of_day?: 'morning'|'afternoon'|'evening'|'night' }`) → `{ steps: RecipeStep[] }`

`type Content = { id: string; type: 'music'|'ambient'|'voice'|'activity'|'card'; title: string; locale: 'ko'|'en'; duration_sec: number; uri?: string; tags?: any; license?: any }`
`type RecipeStep = { type: 'music'|'ambient'|'voice'|'activity'|'card'; min_sec?: number; max_sec?: number; scene_preset?: string; tags?: any }`

#### curriculum
- curriculum.units.upsert(input: `{ title: string; taxonomy?: any; activities?: any[]; rubric_refs?: string[]; version?: string }`) → `CurriculumUnit`
- curriculum.units.list(input: `{ cursor?: string; limit?: number }`) → `{ items: CurriculumUnit[]; nextCursor?: string }`
- curriculum.plans.upsert(input: `{ horizon_weeks: number; items: Array<{ day:number; type:'activity'|'scenario'; ref:string; notes?:string }> }`) → `{ _id: string }`
- curriculum.assignments.log(input: `{ plan_id: string; day: number; type:'activity'|'scenario'; ref: string; status?: 'pending'|'done'|'skipped'; feedback?: string }`) → `{ _id: string }`
- (계획) plan.get(input: `{ theme?: string }`) → `{ plan: any }`
- (계획) progress.update(input: `{ plan_id: string; day: number; status: 'done'|'skip'|'todo'; metrics?: any }`) → `{ ok: true }`

#### metrics
- upsertUserMetric(input: `{ ts?: string; mood?: number; energy?: number; valence?: number; anxious?: number; sleep?: number; focus?: number; sel_scores?: { empathy?: number; boundary?: number; help_seek?: number; conflict?: boolean; responsibility?: number; digital_citizenship?: number } }`) → `{ ok: true }`
- listUserMetrics(input: `{ userId?: string; from?: string; to?: string; limit?: number; cursor?: string }`) → `{ items: UserMetric[]; nextCursor?: string }`

`type UserMetric = { _id: string; user_id: string; ts: string; mood?: number; energy?: number; valence?: number; anxious?: number; sleep?: number; focus?: number; sel_scores?: Record<string,number> }`

#### actions
- log(input: `{ ts?: string; type: 'login'|'ritual_start'|'ritual_complete'|'quest_choice'|'content_play'|'content_skip'|'like'|'dislike'|'share'|'safety_view'|'referral_request'; meta?: any; session_id?: string }`) → `{ ok: true }`
- list(input: `{ userId?: string; type?: string; from?: string; to?: string; limit?: number; cursor?: string }`) → `{ items: UserAction[]; nextCursor?: string }`

`type UserAction = { _id: string; user_id: string; ts: string; type: string; meta?: any; session_id?: string }`

#### sel
- evaluateTurn(input: `{ sessionId: string; turnId?: string; signals: { empathy?: boolean; boundary?: boolean; help_seek?: boolean; conflict?: boolean; responsibility?: boolean; digital_citizenship?: boolean } }`) → `{ score: number; breakdown: Record<string,number> }`
- getUserSelSummary(input: `{ userId?: string; window?: '7d'|'30d'|'90d' }`) → `{ summary: Record<string,number>; trend: Array<{ ts: string; score: number }> }`

#### admin.assets
- uploadStart/list/delete 동일

#### admin.points
- create/update/remove 동일

#### admin.users
- logs 동일

#### risk
- flag/alert.subscribe 동일

### 예시
```ts
// audio push (3–5s 윈도)
await trpc.audio.pushClientStats.mutate({
  sessionId: 'sess_123',
  window_id: 'w_001',
  ts: new Date().toISOString(),
  ser_label: 'anxious', ser_conf: 0.76, speech_rate: 4.2, vad_ratio: 0.18
})

// subscribe to intents
const sub = trpc.dialogue.streamIntent.subscribe({ sessionId: 'sess_123' }, {
  onData: (evt) => console.log('intent', evt)
})
```

### 추가 네임스페이스

#### scenario
- scenarios.upsert(input: `{ _id?: string; title: string; domain: 'assessment'|'intervention'; tags?: string[]; version?: string; inputs?: any; steps?: any[]; scoring?: any; meta?: any }`) → `Scenario`
- scenarios.list(input: `{ cursor?: string; limit?: number }`) → `{ items: Scenario[]; nextCursor?: string }`
- scenario.results.log(input: `{ scenario_id: string; scores?: Record<string,number>; risk_flags?: string[]; raw?: any }`) → `{ _id: string }`
- (계획) play.start(input: `{ scenario_id: string; ts_start?: string }`) → `{ playId: string }`
- (계획) play.update(input: `{ playId: string; choices?: any[]; outcome?: any; ts_end?: string }`) → `{ ok: true }`
- (계획) listByUser(input: `{ userId?: string; limit?: number; cursor?: string }`) → `{ items: ScenarioPlay[]; nextCursor?: string }`

`type Scenario = { _id: string; title: string; domain: 'assessment'|'intervention'; tags?: string[]; version?: string; inputs?: any; steps: any[]; scoring?: any; meta?: any; created_at?: string; updated_at?: string }`
`type CurriculumUnit = { _id: string; title: string; taxonomy?: any; activities: any[]; rubric_refs: string[]; version?: string; created_at?: string; updated_at?: string }`

#### summaries
- session.upsert(input: `{ session_id: string; summary_text: string; topics?: string[]; key_points?: string[]; mood_delta?: number; sel_delta?: Record<string,number>; ts?: string }`) → `{ ok: true }`
- session.list(input: `{ userId?: string; limit?: number; cursor?: string }`) → `{ items: SessionSummary[]; nextCursor?: string }`
- daily.upsert(input: `{ date: string; summary_text: string; mood_avg?: number; sel_summary?: Record<string,number>; top_topics?: string[] }`) → `{ ok: true }`
- daily.get(input: `{ date: string; userId?: string }`) → `DailySummary`
- daily.list(input: `{ userId?: string; from?: string; to?: string; limit?: number; cursor?: string }`) → `{ items: DailySummary[]; nextCursor?: string }`

`type SessionSummary = { _id: string; user_id: string; session_id: string; ts: string; summary_text: string; topics?: string[]; key_points?: string[]; mood_delta?: number; sel_delta?: Record<string,number> }`
`type DailySummary = { _id: string; user_id: string; date: string; summary_text: string; mood_avg?: number; sel_summary?: Record<string,number>; top_topics?: string[] }`

### 추가 네임스페이스(상호작용/행동/감정)

#### interactions
- log(input: `{ sessionId: string; ts?: string; type: 'touch_pet'|'stroke'|'throw_prop'|'pick_item'|'ui_select'|'microphone_on'|'microphone_off'; intensity?: number; position?: [number,number,number]; meta?: any }`) → `{ ok: true }`
- list(input: `{ sessionId?: string; userId?: string; from?: string; to?: string; limit?: number; cursor?: string }`) → `{ items: Interaction[]; nextCursor?: string }`

`type Interaction = { _id: string; user_id: string; session_id: string; ts: string; type: string; intensity?: number; position?: [number,number,number]; meta?: any }`

#### characterActions
- log(input: `{ sessionId: string; ts?: string; action: 'approach_slow'|'step_back'|'comfort_pose'|'surprise_jump'|'look_around'|'idle_sit'|'orbit_user'|'play_with_prop'|'land_on_rock'; params?: any }`) → `{ ok: true }`
- list(input: `{ sessionId?: string; from?: string; to?: string; limit?: number; cursor?: string }`) → `{ items: CharacterAction[]; nextCursor?: string }`

`type CharacterAction = { _id: string; session_id: string; ts: string; action: string; params?: any }`

#### emotions
- log(input: `{ sessionId: string; ts?: string; label: 'happy'|'sad'|'angry'|'surprised'|'anxious'|'neutral'; intensity?: number; features?: any }`) → `{ ok: true }`
- series(input: `{ userId?: string; window?: '1d'|'7d'|'30d'; label?: string }`) → `{ points: Array<{ ts: string; label: string; intensity?: number }> }`

### 추가 네임스페이스(환경/BGM)

#### env
- getPreset(input:{ time?:string, weather?:'clear'|'cloudy'|'rain'|'snow', state?:{ need?:'calm'|'sleep'|'focus'|'mood_lift'|'grounding'; regulation?:'downregulate'|'stabilize'|'upregulate' }}) → EnvPreset
- transition(input:{ toPresetId?:string, toTrackId?:string, reason:string, params?:any }) → { ok:true }

`type EnvPreset = { _id: string; name: string; timePhase: 'dawn'|'day'|'dusk'|'night'; weather: 'clear'|'cloudy'|'rain'|'snow'; light:any; fog:any; particles:any; post:any }`

#### bgm
- tracks.list(input:{ filter?: any; limit?: number; cursor?: string }) → `{ items: Track[]; nextCursor?: string }`
- tracks.pick(input:{ policy:{ need:'calm'|'sleep'|'focus'|'mood_lift'|'grounding', timePhase:'dawn'|'day'|'dusk'|'night', weather:'clear'|'cloudy'|'rain'|'snow', regulation?:'downregulate'|'stabilize'|'upregulate' }, constraints?:{ max_energy?:number }}) → `{ trackId: string }`

`type Track = { _id: string; title: string; composer: string; uri: string; duration_sec: number; tags: { bpm?: number; mode?: 'major'|'minor'|'modal'; energy?: number; valence?: number; safety_level: 'S0'|'S1'|'S2' } }`

### 추가 네임스페이스(AI)

#### ai
- memory.brief(input:{ userId?:string; sessionId?:string; limit?: number }) → { briefs: Array<{ source:'daily'|'session'|'scenario' , id:string, summary:string, ts:string }> }
- intent.decide(input:{ sessionId:string; signals: { ser?: AudioStatsPacket; metrics?: Partial<UserMetric> }; text?: string; context?: any }) → IntentEvent
- reply.generate(input:{ sessionId:string; text?:string; intent?:IntentEvent; style?:'short'|'normal'; locale?:'ko'|'en' }) → { text:string, safety:{ flagged:boolean, reason?:string } }

### ai.* 서브라우터(멀티에이전트)

#### ai.perception
- summarize(input:{ sessionId:string; signals?:{ ser?:AudioStatsPacket }; text?:string }) → { state:{ need, level, risk, topics?:string[] } }

#### ai.coach
- prompt(input:{ sessionId:string; state:any; brief?:string }) → { text:string, next?:{ ritual?:string; question?:string } }
- recordSel(input:{ rubric:Record<string,number>; source:'turn'|'scenario'|'daily'; ref_id?:string }) → { ok:true }

#### ai.director
- decideActions(input:{ sessionId:string; state:any; policy?:any }) → IntentEvent

#### ai.curator
- recommendScenario(input:{ userId?:string; context?:any }) → { scenario_id:string, reason:string }

#### ai.scheduler
- planNext(input:{ userId?:string; window?:'today'|'7d' }) → { tasks: SchedulerTask[] }
- upsertTask(input:{ task: SchedulerTask }) → { ok:true }

`type SchedulerTask = { _id?:string; user_id?:string; due_ts:string; type:'ritual'|'session'|'scenario'; payload?:any; status?:'pending'|'sent'|'done'|'skipped' }`

#### ai.safety
- assess(input:{ sessionId?:string; text?:string; signals?:any }) → { flagged:boolean; score?:number; action?:'guide'|'connect' }
- flag(input:{ sessionId:string; score:number; reason?:string }) → { ok:true }

### ai.master (스켈레톤 자동 확장)
- proposeSkeleton(input:{ base_id_code:string; signals?:any; metrics_snapshot?:any }) → { draft_id:string, diff:any, safety_score:number, rationale:string }
- validateDraft(input:{ draft_id:string }) → { passed:boolean, checks:{ safety:boolean, rules:boolean, tokens:boolean }, sim:{ expected_sel_uplift?:number } }
- shadowTest(input:{ draft_id:string; sample:number }) → { result:{ win_rate:number, n:number } }
- promoteDraft(input:{ draft_id:string; mode:'auto'|'manual' }) → { skeleton_id:string, version:string }

### scheduler (크론/잡)
- jobs.enqueue(input:{ type:'ai_propose'|'pack_rebuild'|'summary_rollup'|'notification', payload?:any, run_at?:string }) → { job_id:string }
- jobs.status(input:{ job_id:string }) → { status:'queued'|'running'|'done'|'failed' }

### WebSocket 채널
- ws.master.proposals.subscribe() ⇒ { draft_id, base_id_code, safety_score, rationale, ts }
- ws.scheduler.jobs.subscribe() ⇒ { job_id, type, status, ts }

### bible / knowledge

#### bible.admin
- unit.upsert(input:{ unit: any }) → { id: string, version: string }
- unit.list(input:{ version?:string; locale?:'ko'|'en'; stage?:string; cursor?:string; limit?:number }) → { items:any[]; nextCursor?:string }
- unit.promote(input:{ id:string; toStage:'alpha'|'beta'|'prod' }) → { ok:true }

#### knowledge.admin
- pack.build(input:{ bible_version:string; options?:any }) → { pack_id:string, version:string }
- pack.list(input:{ bible_version?:string; cursor?:string; limit?:number }) → { items:any[]; nextCursor?:string }
- pack.promote(input:{ pack_id:string; toStage:'alpha'|'beta'|'prod' }) → { ok:true }

#### ai.bible
- usePack(input:{ pack_id:string }) → { ok:true }
- currentPack() → { pack_id:string, version:string }
