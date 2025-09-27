## AI 그라운딩 & Knowledge Pack 전략

### 접근
- 순수 LLM 지식 의존(X) → 프로젝트 바이블 기반 그라운딩(O)
- 이유: 일관성/안전/문화 적합성/버전 관리/검증 가능성 확보

### Knowledge Pack
- 구성: { bible_version, unit_summaries[], rubrics, action_mapping, safety_rules, style_guide }
- 저장: knowledge_packs 컬렉션 + 파일(blob) (요약/규칙 중심, 원문 최소)
- 핀: ai 호출 시 `pack_id@version` 명시, 응답 로그에 버전 기록

#### Lite 패키지(권장)
- 목적: 얇고 민첩한 주입. 거대 원문 대신 요약·규칙·매핑만 포함.
- 필드:
  - `unit_summaries`: 유닛 목표/핵심 문장 3–5줄, 토큰 절약형
  - `rubrics`: SEL 신호 체크리스트/점수 규칙
  - `action_mapping`: 감정/의도→행동·씬·BGM 매핑
  - `safety_rules`: 금지/회피/에스컬레이션 규칙(한국 맥락 포함)
  - `style_guide`: 펫-컴패니언 톤(사용자보다 똑똑하지 않음, 유도형 대화)

#### 버전/스테이지
- 버전: `vMAJOR.MINOR.PATCH` (핫픽스는 PATCH)
- 스테이지: `dev/alpha/beta/prod` — 에이전트는 기본 `prod` 핀, 실험 그룹에만 `beta`

#### 로깅/트레이스
- 모든 AI 호출에 `ai_traceId`, `provider/model/pack_version` 기록
- 회귀 발생 시 해당 트레이스의 pack_version 기준 롤백

### 리트리벌
- 우선순위: pack → user memory brief → session/daily summaries → turns 검색
- 토큰 절감: unit_summaries 1–3개 + rubrics 핵심 가드만 포함

### 업데이트/검증
- A/B 경로 실험 → 성과가 높은 유닛/시퀀스를 승격
- 안전/정책 변경 즉시 pack hotfix 버전 발행

### Autopilot 연동
- ai.master: `propose → validate → shadowTest → promote` 루프에서 Knowledge Pack 영향 평가
- validate: 안전/룰/토큰 체크 + 예상 SEL uplift 시뮬레이션
- shadowTest: 소수 트래픽에 섀도우 주입(응답 미표출) → 승률/리스크 수집
- promote: 스테이지 승격, 실패 시 자동 롤백 + 알림

### 운영
- 어드민 Bible Studio에서 생성/검수/버전 배포
- AI 에이전트는 최신 안정 버전을 기본 핀, 실험 그룹에만 베타 핀
 - tRPC: `knowledge.packs.upsert/list`, `ai.bible.usePack/currentPack`로 관리
