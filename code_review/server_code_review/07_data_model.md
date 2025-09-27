# 데이터 모델/인덱스

## 주요 컬렉션
- sessions(user_id, t_start/t_end)
- dialogue_turns(session_id, role, text, created_at)
- ai_events(user_id, type, payload, ts)
- sel_evaluations(user_id, scores, ts)
- session_summaries/daily_summaries
- scheduler_tasks(type, payload, status, created_at)
- sel_bible_units / knowledge_packs / coaching_skeletons
- user_profiles / user_settings / user_devices / user_preferences / user_progress / interactions / audio_windows / user_metrics
 - scenarios / scenario_results
 - curriculum_units / curriculum_plans / curriculum_assignments

## 인덱스(서버 부팅 시 생성)
- user_id+ts, session_id+created_at 등 조회 경로 최적화
 - scenarios: { title:1, domain:1, updated_at:-1 }
 - scenario_results: { user_id:1, ts:-1, scenario_id:1 }
 - curriculum_units: { title:1, version:1, updated_at:-1 }
 - curriculum_plans: { user_id:1, created_at:-1 }
 - curriculum_assignments: { user_id:1, plan_id:1, day:1, ts:-1 }
