## 코칭 스켈레톤 Seed(베이스)

### 목적
- 최소 공통 구조(모세 10계명처럼)로 어떤 주제에도 적용 가능한 코칭 턴 시퀀스의 베이스
- 이 베이스에서 세부 질문/활동/톤을 LLM이 즉시 합성/확장

### 스키마(초안)
```json
{
  "id_code": "BASE_SKEL_V1",
  "title": "베이스 코칭 스켈레톤",
  "level": [1,2,3],
  "blocks": [
    { "name": "stabilize", "goal": "긴장 완화/정서 인정", "guard": ["비판단","저자극"], "output": "1~2문장" },
    { "name": "clarify", "goal": "사실/맥락 확인", "guard": ["추측 금지"], "output": "질문 1개" },
    { "name": "micro_action", "goal": "작은 행동 제안(호흡/미니 활동)", "guard": ["안전","쉬움"], "output": "단계 1개" },
    { "name": "reflect", "goal": "자기인식/리플렉션", "guard": ["낙인 금지"], "output": "질문 1개" },
    { "name": "reinforce", "goal": "칭찬/핵심 요약/다음 한 걸음", "guard": ["희망","자기효능감"], "output": "1문장" }
  ],
  "rubric_refs": ["SEL_RUBRIC_V1"],
  "style": { "tone": "따뜻함/안정/긍정", "length": "짧고 선명", "avoid": ["의학/진단","과장"] },
  "fallbacks": { "short": true, "ritual": "breathing_1min" }
}
```

### 운용
- Admin: 수정 가능(블록 추가/삭제/순서), 버전 관리
- AI: `BASE_SKEL_V1`을 받아 주제/상태에 맞는 문장/활동을 즉시 채워 넣고 진행
- Evaluator: 각 블록 종료 시 루브릭 점수화(E0~E3)

### 확장 예시
- 공감 유닛: `clarify`에 감정 라벨링 질문 프롬프트 추가
- 경계 유닛: `micro_action`을 “경계 문장 연습”으로 대체
