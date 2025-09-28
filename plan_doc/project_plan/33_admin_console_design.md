## Admin Console Design — 통합 MAGI/Autopilot/Bible 스튜디오

### 목적/범위
- 목표: AI 정서교육 플로우를 “한 화면”에서 유기적으로 테스트·관찰·수정·승격하는 워크벤치 제공.
- 범위: 사용자↔AI 대화(좌) · MAGI 파이프라인(중) · Master/Autopilot·Bible/Knowledge(우) 동시 관찰/제어.
- 철학: “사용자보다 멍청한 동반자” 페르소나를 유지하되, 내부 툴에서는 에이전트 상호작용/결정을 투명하게 추적.

### 페르소나/권한(RBAC)
- Admin: 전역 쓰기/승격/환경 토글/실험 배포.
- Operator: 콘텐츠/시나리오/커리큘럼/자산 관리, 테스트 벤치 사용(승격은 제안까지만).
- Reviewer: 읽기/검수/승격 제안.

### 화면 레이아웃(초광폭 고정)
- 3컬럼 고정: 좌 40% / 중 40% / 우 20%, 사이드바 300px, 헤더 64px.
- 공통 상단 바: API Base, Stage(Beta/Prod), WS/SSE 상태, 현재 sessionId·userId 핀 표시.

### 네비게이션(IA)
- Orchestration Lab(핵심 테스트 화면)
- Bible & Knowledge(유닛/팩 버전/승격)
- Scenarios & Curriculum(목록·에디터·Export)
- AI Console(프롬프트/응답/스타일·세이프티 테스트)
- Assets3D / Env&BGM / Storage / Users / Realtime

### Orchestration Lab(핵심)
좌: User↔AI 대화 클라이언트
- 기능: 실시간 채팅(시작/끝 세션), 음성 대신 텍스트 입력, 대화 turn 로깅, scenario 주입(옵션).
- 컨텍스트: Knowledge Pack 핀(`pack_id@version`), Persona/Style/Safety 프리셋 토글, 세션 복원.

중: MAGI 파이프라인 라이브 트레이스
- Perception: 입력 신호 요약(SER/텍스트/메트릭) → state 추정(need/level/risk/topics).
- Coach: 응답 초안/톤/스타일, 금칙어·루브릭 적용 전후 비교.
- Director: Intent 결정(intent/expr/anim/fx/target) 및 정책 룰 히트 맵.
- Curator: 추천 시나리오/리추얼/유닛, Knowledge Pack 해시/버전 표시.
- Safety: 차단/가이드·연결 플래그, 근거 키워드.
- 트레이스: `ai_traceId`, provider/model/pack_version, 소요시간, 실패/재시도.

우: Master(Autopilot)·Bible/Knowledge
- Autopilot: propose → validate → shadow → promote 파이프라인 버튼/큐 상태.
  - Validate: safety/rules/token/예상 uplift 체크 결과 표.
  - Shadow: 샘플 n, win_rate, 리스크 이벤트.
  - Promote: 모드(auto/manual), 롤백 핸들.
- Bible/Knowledge: 유닛 diff 뷰(좌: 현재, 우: 제안 드래프트), 승격/보류/수정.
- Pack 핀: prod/beta 핀 전환, 테스트 세션은 beta 지정 가능.

### 실시간/로그
- WS 채널: `/ws/master.proposals`, `/ws/scheduler.jobs`, `/ws/dialogue.intents`.
- 이벤트 패널: turn/intent/safety/pack_change/job 상태 스트림.
- 로그 필드: reqId/userId/sessionId/ai_traceId/provider/model/pack_version/autopilot_phase.

### 테스트 시나리오(절차)
1) 세션 시작 → Persona/Pack 핀 지정 → 사용자 입력 3~5턴.
2) MAGI 트레이스 확인: Perception→Coach→Director→Safety 적용.
3) Master propose 실행 → validate 체크 통과 시 shadow 소규모 트래픽 → promote(수동/자동).
4) Bible 유닛 diff 검토 → Knowledge Pack beta build → 실험 그룹 핀.
5) 결과 관찰: uplift 지표/리스크/토스트 알림/실패 시 롤백.

### 데이터 상호작용(연결)
- Dialogue ↔ MAGI: `ai.perception.summarize`, `ai.director.decideActions` 호출 하이라이트.
- MAGI ↔ Master: 성능/리스크 신호를 propose 파이프라인 입력으로 축약.
- Master ↔ Bible/Knowledge: 드래프트→승격 시 유닛/팩 버전 bump, 핀 업데이트.
- Scenarios/Curriculum: 추천 결과를 중앙 패널에서 바로 할당/로그.

### 보안/권한/가드
- 클라(UI): `roles` 기반 버튼/액션 가드(표시/비활성화). 서버 tRPC는 최종 검증.
- 고위험: promote/pack pin 변경은 Admin 전용 + 확인 다이얼로그 + 감사 로그.

### 배포/운영
- Stage 분리(dev/beta/prod), 로그 샘플링/레벨 토글.
- 실패 대응: 모델 장애, 토큰 폭주, 스토리지 오류 런북 링크.

### 향후 고도화
- TanStack Table 전면 적용(가상 스크롤/컬럼 고정/서버 페이징).
- 3D 씬 WebGL 프리뷰(포인트/애니 미리보기), 시나리오 노드 에디터.
- A/B 실험/승격 자동화, LLM 비용/응답품질 대시보드.

### 서버 라우트 맵(요약)
- ai.reply.generate, ai.perception.summarize, ai.director.decideActions
- ai.master.propose/validate/shadowTest/promote
- bible.units.upsert/list, knowledge.packs.upsert/list
- scenarios.*, curriculum.*, env.getPreset, bgm.tracks.pick, storage.presign, users.*

### 성공 기준(테스트 관점)
- 대화 5턴 내 MAGI 의사결정/안전 가드 정상.
- Master propose→validate→shadow→promote end-to-end 1회 성공.
- Bible 유닛 diff→팩 beta 핀→대화 반영까지 1분 내 확인.

