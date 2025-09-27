## 데이터 모델(개념: MongoDB)

컬렉션
- users: { _id, email?, locale, profile, consent_flags, created_at }
- sessions: { _id, user_id, device_info, t_start, t_end, notes }
- dialogue_turns: { _id, session_id, role, text?, intent, action_decision, character_state_before, character_state_after, created_at }
- audio_windows: { _id, session_id, t0,t1, pitch_mean, pitch_var, energy_mean, energy_var, mfcc32_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score, clip_ref? }
- scene_configs: { _id, background_asset_id, weather, points:[...], props:[...], version, stage }
- assets: { _id, type, uri, version, size, hash, meta }
- curriculum_plans: { _id, theme, day_steps: [...] }
- progress: { _id, user_id, plan_id, day, status, metrics }
- experts, referrals, audit_logs
- user_metrics: { _id, user_id, ts, mood?, energy?, valence?, anxious?, sleep?, focus?, sel_scores? }
- user_actions: { _id, user_id, ts, type, meta?, session_id? }
- scenario_plays: { _id, user_id, ts_start, ts_end?, scenario_id, choices?: any[], outcome?: any, tags?: string[] }
- session_summaries: { _id, user_id, session_id, ts, summary_text, topics?: string[], key_points?: string[], mood_delta?: number, sel_delta?: Record<string,number> }
- daily_summaries: { _id, user_id, date: string(YYYY-MM-DD), summary_text, mood_avg?: number, sel_summary?: Record<string,number>, top_topics?: string[] }

(추가)
- ai_events: { _id, user_id?, session_id?, ts, agent:'perception'|'coach'|'director'|'curator'|'scheduler'|'safety', input_ref?: any, output_ref?: any, summary?: string }
- sel_evaluations: { _id, user_id, ts, rubric: { empathy?: number, boundary?: number, help_seek?: number, conflict?: number, responsibility?: number, digital_citizenship?: number }, source: 'turn'|'scenario'|'daily', ref_id?: string }
- scheduler_tasks: { _id, user_id, due_ts, type: 'ritual'|'session'|'scenario', payload?: any, status: 'pending'|'sent'|'done'|'skipped' }
- sel_bible_units: { _id, version, id_code, title, objective, prerequisite?, materials?, script?, scenarios?, practice?, reflection?, assessment?, level:1|2|3, locale:'ko'|'en', stage:'dev'|'alpha'|'beta'|'prod' }
- knowledge_packs: { _id, bible_version, unit_summaries: any[], rubrics: any, action_mapping: any, safety_rules: any, style_guide: any, created_at }
- coaching_skeletons: { _id, id_code, title, level:[1|2|3], blocks: any[], rubric_refs?: string[], style?: any, fallbacks?: any, version, stage }
- skeleton_drafts: { _id, source:'admin'|'ai', base_id_code?:string, diff:any, status:'draft'|'review'|'approved', created_at }

인덱스 예시
- scenario_plays: { user_id:1, ts_start:-1 }, { scenario_id:1, ts_start:-1 }
- session_summaries: { user_id:1, ts:-1 }, { session_id:1 }
- daily_summaries: { user_id:1, date:-1 }
- dialogue_turns: { session_id:1, created_at:1 }, 텍스트 검색을 위한 `text` 인덱스(필드: text)

인덱스
- ai_events: { agent:1, ts:-1 }, { user_id:1, ts:-1 }
- sel_evaluations: { user_id:1, ts:-1 }
- scheduler_tasks: { user_id:1, due_ts:1, status:1 }
- sel_bible_units: { version:1, id_code:1, locale:1, stage:1 }
- knowledge_packs: { bible_version:1, created_at:-1 }
- coaching_skeletons: { id_code:1, version:1, stage:1 }
- skeleton_drafts: { status:1, created_at:-1 }

리트리벌 전략
- 홈/재개: 최근 `daily_summaries` 및 `session_summaries` 상위 N개 조회
- 검색: `dialogue_turns.text` text 인덱스 + 필터(기간/토픽) → 해당 `session_id`로 상세 리플레이
- 비용 절감: 초기 로딩은 요약만, 상세 회상 시 해당 세션의 턴을 지연 로드

보존/TTL
- audio_windows.clip_ref(옵트인 클립) TTL 30일 옵션
- user_actions는 12–18개월 보존 정책(집계 후 요약 유지)

집계/파생 지표(예)
- 일/주간 mood 평균, anxious 95p, 리추얼 완주율, 콘텐츠 스킵률
- SEL 스코어 스무딩(EMA), 레시피 추천 가중치에 반영
