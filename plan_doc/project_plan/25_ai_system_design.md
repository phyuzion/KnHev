## AI 시스템 설계 — MAGI 멀티에이전트 블루프린트

### 상위 목표(역할 매핑)
1) Perception(사용자 파악): 정서 신호/대화/행동에서 현재 상태/니즈 추정
2) Coach(정서교육 진행): 코칭 대화/과제/리추얼 제안, 강화 피드백
3) Director(행동/연출 부여): 캐릭터/씬/BGM 지시 생성(의도→액션)
4) Curator(시나리오 큐레이션): 적절한 시점의 퀘스트/리추얼/콘텐츠 추천
5) Scheduler(스케줄/알림): 사용자 패턴/가용 시간 기반 타이밍 조율
6) Safety(세이프티 감시): 위험 감지→연결/기록/가드

### 사전 지식/사전 교육(Pretraining/Policy)
- 정서교육 커리큘럼/루브릭: SEL 축(공감/경계/도움요청/갈등/책임/디지털 시민성)
- 대화 가이드라인: 비판단/안전/한국문화 레이어 표현 규칙
- 행동 매핑 테이블: 감정→의도→연출 파라미터 매핑
- 시나리오 노드/질문뱅크: 테마별 Hook/탐색/분기/리플렉션 템플릿
- BGM 정책: 곡 메타(에너지/발란스/금기) 기반 전환 규칙

### 데이터 입출력(핵심 구조)
- 입력: SER 요약/metrics, recent memory briefs(daily/session), user_actions, scenario_plays, time/weather
- 출력: intent(commands), coach replies, scenario recommendations, schedule tasks, safety flags

### 오케스트레이션(런타임)
- Orchestrator(파사드): 각 에이전트를 호출/합성, 충돌 시 정책 우선순위 적용
- 이벤트 루프: 3–5s tick(Perception 업데이트) + 사용자 발화/상호작용 트리거 시 재평가
- 상태 캐시: need(level)/risk, 최근 토픽/목표, 현재 레시피/씬/BGM

### 에이전트별 설계
- Perception
  - 입력: SER/emotions/metrics, turns 요약, actions
  - 산출: state = { need, level, risk, topics, user_tone }
  - 구현: 규칙+경량 LLM 분류, 토큰 절감을 위해 memory.brief 우선
- Coach
  - 입력: state, memory.brief, sel rubric
  - 산출: 코칭 메시지/질문, 과제/리추얼 제안, 교육 포인트 기록(sel_evaluations)
  - 구현: 프롬프트 템플릿 + 안전 가드 + 한국어 톤 가이드
- Director
  - 입력: state/intent 후보, 행동 매핑 테이블
  - 산출: 캐릭터 지시/환경/BGM 전환(속도/쿨다운 준수)
  - 구현: 룰 우선, 필요 시 LLM로 미세 조정
- Curator
  - 입력: history(scenario_plays/daily summaries), 시간대/날씨, 선호/금기
  - 산출: 시나리오/레시피 추천(근거 포함), 충돌 시 안전 우선
- Scheduler
  - 입력: 사용자 사용 패턴(요일/시간대), 캘린더(옵션), 선호 길이
  - 산출: 알림/리마인더/다음 세션 제안 타이밍
- Safety
  - 입력: 텍스트/톤 급변/무음/리스크 지표
  - 산출: risk.flag, 가이드 카드, 관리자 알림, 옵트인 클립 업로드 요청

### 비용/성능 전략
- memory.brief 캐시 재사용, 응답 길이 제약, 템플릿 우선/LLM 최소화
- 중요 순간만 고품질 모델로 승격, 나머지는 규칙/단문

### 품질/KPI
- 교육 지표: SEL 축 향상도, 과제 완주율, 재방문율
- 안전: 오탐/미탐 최소화, 가드 위반 0건 목표

## Autopilot(완전 AI 자율 확장)

- 루프: propose → validate → shadow → promote → observe
- propose: 마스터 AI가 텔레메트리 기반 파생 스켈레톤/프롬프트 힌트 생성
- validate: 규칙/안전/토큰/톤 정적 검사 + 시뮬레이션 SEL 예상치
- shadow: 실제 유저 트래픽 미노출 가상 테스트로 승률 산정
- promote: 기준 충족 시 자동 승격(저위험), 고위험은 관리자 승인
- observe: 실사용 KPI 모니터링, 이상 시 자동 롤백
- 인간 개입: 기본 off, 위험/예외시에만 on (toggle)
- 불변 레이어: persona/style/safety/rubric/action_mapping은 고정

## LLM 공급자/호스팅 전략(마스터 AI)

- 어댑터 계층: provider = openai|anthropic|google|azure|llama(self-host), 공통 인터페이스 `generate()/embed()/moderate()`
- 환경 변수: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, (self-host) `LLAMA_ENDPOINT`
- 라우팅: 기본 가성비 모델 → 중요 순간/안전 재평가 시 고품질 모델 승격
- 이행 경로: 초기 SaaS(OpenAI/Gemini) → 중기 하이브리드(필수 경로만 self-host Llama) → 장기 완전 self-host(규제/비용/프라이버시)
- 핀/감사: 모든 AI 호출에 provider/model/pack_version 기록, 재현성 확보

## MCP 연동(에이전트 내부 오케스트레이션)
- 에이전트는 MCP Client로, 서버는 MCP Server로 동작하여 공통 툴 인터페이스 사용
- 핵심 툴: memory/summaries/sel/director/env/bgm/interactions/ai.master/skeleton.admin
- 트랜스포트: WebSocket(JSON-RPC), 인증 토큰/스코프 제어
