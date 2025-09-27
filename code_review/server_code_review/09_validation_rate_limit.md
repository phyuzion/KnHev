# 입력 검증/레이트리밋

## zod 검증 적용
- ai/users/blocklist/scheduler/observations/summaries 등 핵심 라우트
- 실패 시 400 { error: 'invalid_input', issues }

## 레이트리밋
- in-memory per-IP per-key
- ai_reply: 20/min, default: 120/min (개발용)

## 제안
- Redis 기반 지속형으로 전환, 사용자 등급별 한도, 지수 백오프
