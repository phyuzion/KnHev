## 캐릭터 행동 매핑

- 입력: SER/metrics/turns/contexts
- 판단: LLM+룰 → intent/expr/anim/target
- 연동: 환경/BGM 엔진과 동기화(need/timePhase/weather), 가드/쿨다운 준수
- Idle: FSM + 스케줄러 + 가중치/쿨다운, 서버 의도 선점
