# 실시간(SSE/WS)

## 구조
- `realtime.ts`: SSE 구독 관리 + WS 채널 브로드캐스트
- 마스터 제안/스케줄러 잡 이벤트를 양 채널로 송신

## 엔드포인트
- SSE: `/events.master.proposals`, `/events/scheduler.jobs`
- WS: `/ws/master.proposals`, `/ws/scheduler.jobs`

## 사용처
- 어드민 대시보드에서 실시간 제안/잡 상태 갱신

## 개선 포인트
- 인증된 WS 세션, 재연결/백오프 전략, 이벤트 타입 버전닝
