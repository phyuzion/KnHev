# 로깅/관측성

## 개발 로깅
- 간결 JSON: req(input 요약)/res(body 요약)
- PRETTY_LOG=1 시 깔끔한 출력

## AI 트레이스
- ai.reply/safety.blocked/llm.request 등 `ai_events` 기록
- 필수 필드: `ai_traceId`, `provider`, `model`, `pack_version`, `autopilot_phase?('propose'|'validate'|'shadow'|'promote')`

## 제안
- 에러/성능 메트릭, 샘플링, 트레이스 ID, 요청 상관키
 - Autopilot 가드 이벤트(토글/승격/롤백) 요약 기록
