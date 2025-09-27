## AI 그라운딩 & Knowledge Pack 전략

### 접근
- 순수 LLM 지식 의존(X) → 프로젝트 바이블 기반 그라운딩(O)
- 이유: 일관성/안전/문화 적합성/버전 관리/검증 가능성 확보

### Knowledge Pack
- 구성: { bible_version, unit_summaries[], rubrics, action_mapping, safety_rules, style_guide }
- 저장: knowledge_packs 컬렉션 + 파일(blob) (요약/규칙 중심, 원문 최소)
- 핀: ai 호출 시 `pack_id@version` 명시, 응답 로그에 버전 기록

### 리트리벌
- 우선순위: pack → user memory brief → session/daily summaries → turns 검색
- 토큰 절감: unit_summaries 1–3개 + rubrics 핵심 가드만 포함

### 업데이트/검증
- A/B 경로 실험 → 성과가 높은 유닛/시퀀스를 승격
- 안전/정책 변경 즉시 pack hotfix 버전 발행

### 운영
- 어드민 Bible Studio에서 생성/검수/버전 배포
- AI 에이전트는 최신 안정 버전을 기본 핀, 실험 그룹에만 베타 핀
