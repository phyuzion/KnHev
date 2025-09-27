# 로깅/관측성

## 개발 로깅
- 간결 JSON: req(input 요약)/res(body 요약)
- PRETTY_LOG=1 시 깔끔한 출력

## AI 트레이스
- ai.reply/safety.blocked/llm.request 등 `ai_events` 기록
- 모델/버전/팩 버전 핀 계획 반영 가능

## 제안
- 에러/성능 메트릭, 샘플링, 트레이스 ID, 요청 상관키
