## MCP 아키텍처(Model Context Protocol)

### 목표
- 멀티 에이전트(Perception/Coach/Director/Curator/Scheduler/Safety)가 **MCP**를 통해 공통 규약으로 도구 호출/리소스 접근
- LLM 공급자 교체(OpenAI/Gemini/Llama)와 상관없이 동일한 툴 인터페이스 유지

### 구성
- MCP Server(내부): 도구(Tool) 제공자
- MCP Client(에이전트/LLM): MCP 툴 호출자
- 트랜스포트: JSON-RPC over WebSocket(권장) / stdio(개발 시)

### 주요 도구(툴) 매핑
- memory.brief.fetch(userId, sessionId?) → 최근 daily/session 요약 번들
- summaries.session.upsert(payload) / summaries.daily.upsert(payload)
- sel.evaluate(payload) → 루브릭 점수(E0~E3)
- director.intent.decide(state, policy?) → IntentEvent
- env.transition(toPresetId?, reason) / bgm.pick(policy)
- interactions.log(...), characterActions.log(...), emotions.log(...)
- skeleton.admin.upsert(draft) / ai.master.propose/validate/shadow/promote(draftId)

### 보안/권한
- 인증: 토큰 기반(내부용 `MCP_AUTH_TOKEN`) + 호출 스코프 제한
- 레이트리밋/샌드박스: 고위험 툴은 승인 모드 또는 시뮬 전용 모드

### tRPC와의 관계
- tRPC: 앱 외부/클라이언트-서버 API(모바일/어드민/서비스 경계)
- MCP: **에이전트 내부 오케스트레이션** 채널(서버 내부/백그라운드)
- 필요 시 MCP 툴이 내부적으로 tRPC 호출을 위임하여 동일한 비즈니스 로직 사용

### 로깅/관측성
- mcp_session(start/stop), mcp_tool_call(name, duration, ok), mcp_error(code)
- provider/model/pack_version, reqId 연계

### 이행/호환
- 초기: Perception/Coach/Director 주요 경로 툴화 → Autopilot 관련 툴 추가
- 중기: 모든 ai.* 라우터 동등 MCP 툴 제공, 테스트 통과 후 기본 채널 전환
- 장기: 마스터 AI(Llama self-host)에서 직접 MCP Client로 접속, 완전 자율 운용
