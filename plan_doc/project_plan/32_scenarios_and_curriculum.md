# 시나리오/커리큘럼 설계(진단/교정 + 스케줄링)

## 목적
- 대화만으로는 한계가 있음 → 시나리오 기반 상호작용으로 진단/교정/성장을 유도
- 정서교육 바이블에 시나리오·커리큘럼 축을 추가하여 MAGI 에이전트들이 일관되게 집행

---

## 시나리오(Scenarios)

### 유형
- 진단 시나리오(assessment): 정서·행동 특성/위험 신호 탐지, 베이스라인 측정
- 교정 시나리오(intervention): 특정 결손/불균형을 개선하기 위한 행위·대화 유도

### 근거/원천 예시(진단 지표 세트)
- K-ECI-4, CPSQ-II, AMPQ-III 등 검사지 문항군에서 파생된 상황/역할극/선택지형 시나리오
- 관찰 지표: 반응 지연, 회피 어휘, 시각 접촉, 발화 길이/피치/에너지(오디오), 감정 라벨

### 주요 진단 타겟(예시)
- ADHD, 품행장애, 일반화 불안, 사회 공포, 분리불안, 특정 공포, 강박, PTSD, 틱, 우울, 자폐스펙트럼, 선택적 함구
- 정서역량: 정서/타정서 인식, 정서표현, 정서조절, 감정이입, 정서사고 촉진, 정서지식 활용, 타인정서조절

### 시나리오 구조(초안)
- meta: id, title, domain(assessment|intervention), tags, version
- inputs: 필요 센서/미디어(텍스트/오디오/표정 등)
- steps[]: 블록(프롬프트/역할극/선택지/행동요청)
- scoring: 규칙/가중치/루브릭 연결(SEL_RUBRIC_V1 참조)
- outcomes: risk_flags, subscale_scores, notes

---

## 커리큘럼(Curriculum)

### SEL 4축(사용자 서술 기준)
- 정서인식: 상실감, 트라우마, 특정 공포, 외상, 자아개념, 타인 인식, 감정탐색, 자아 정체성, …
- 정서표현: 우울감, 불안감, 분리불안, 스트레스, 생각 인식, 감정 시각화, 부정적 감정완화, 주의력, …
- 정서조절: ADHD, 품행, 공격성, 위축, 자기조절 인식, 승리/실패, 감정-신체반응, 긴장완화, …
- 정서활용: 사회공포, 분노, 자존감, 부정적 사고 극복, 의사결정, 듣기/말하기, 의사소통, 역할극, …

### 사회정서지능 5 밸런스(바이블 택소노미 확장)
- 자기 인식, 자기 조절, 사회적 인식, 관계관리, 사회적 책임
→ 바이블 unit.taxonomy에 balance 필드 추가(예: { balance: 'self_awareness' })

### 커리큘럼 유닛 구조(초안)
- unit: id, title, objective, prerequisites, content(blocks), activities, rubric_refs, expected_outcomes
- activity 샘플: 눈 마주보기, 함께 웃기, 긍정적 반영, 공감 반복, 하이파이브, 그림/음악 감상, 역할극 등

---

## 스케줄러/플래너

### 정서교육 스케줄러(예시 정책)
- 입력: 사용자 진단 결과(시나리오 점수/리스크), 선호/블록리스트, 가용 시간, 최근 피로도
- 출력: 1주/2주 플랜(일일 1~3개 활동 + 짧은 시나리오), 난이도/노출 균형
- 규칙: 
  - 리스크 플래그 존재 시 교정 시나리오 우선
  - 동일 도메인 과다 노출 방지(밸런스 5요소 비중 유지)
  - 피드백/순응도 낮을 시 step-down(난도/시간 감소)

### 저장/트래킹
- plan: user_id, horizon(weeks), created_at, items[]
- assignment: plan_id, day, type(activity|scenario), status(pending|done|skipped), feedback

---

## 데이터 모델(추가 제안)
- scenarios: 템플릿/버전/스코어링/블록
- scenario_results: user_id, scenario_id, scores, risk_flags, raw
- curriculum_units: taxonomy(balance/sel_area), activities, rubric_refs
- curriculum_plans / curriculum_assignments

인덱스: user_id+ts, scenario_id+ts, plan_id+day

---

## 시스템 연결
- Perception/Director: 결과를 상태/행동 결정에 반영
- Autopilot: 결과 기반으로 교정 시나리오/커리큘럼 제안 → 검증 → 승격
- Bible/Knowledge Pack: 유닛/시나리오 요약/룰/루브릭을 팩에 포함

---

## 앞으로
- 미니게임/역할극 엔진 연동(선택·타이밍·표정 인식), 시뮬레이티드 동료/가족 역할
- 평가 타당화: 파일럿 데이터로 스코어 가중치/컷오프 보정
