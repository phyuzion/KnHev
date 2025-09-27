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

## 인덱스(서버 부팅 시 생성)
- user_id+ts, session_id+created_at 등 조회 경로 최적화
