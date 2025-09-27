## SEL Bible(정서교육 바이블) 설계

### 목적/범위
- 정서교육(SEL)의 목표/원칙/윤리/평가 기준을 일관되게 정의한 기준서
- MAGI 에이전트(Coach/Curator/Perception)가 참조/학습/검증하는 근거 문서

### 택소노미(축/주제)
- 축: 공감, 경계 설정, 도움 요청/연결, 갈등 해결, 책임/수정, 디지털 시민성
- 한국 맥락 테마: 학교/입시, 단체 채팅, 선후배 문화, 가족 소통, 사계절 정서(벚꽃/장마/달빛/억새)

### 유닛 구조
- Unit = { id, title, objective(행동지표), prerequisite, materials(카드/보이스/활동), script(코칭/질문), scenarios(분기), practice(리추얼), reflection(자기점검), assessment(루브릭) }
- 난이도: Level 1~3(연령/숙련/리스크 고려)
- 길이: 3–10분(미니 세션 구성 가능)

### 루브릭(자동 평가 연동)
- 기준: 공감표현, 사실 확인, 경계/안전 언급, 구체적 제안, 2차 가해 회피
- 채점: E0~E3, 가중치 조정 가능, `sel_evaluations`에 저장

### 운영 원칙
- 안전 우선(의학/법률/진단 금지), 낙인 금지, 성장 관점 피드백
- 문화/연령 적합성, 민감 주제 가드

### 버전/배포
- bible_version: semver, 변경 로그 유지
- 스테이지: dev/alpha/beta/prod, AI는 고정 버전 핀(pin)으로 추론

### 그라운딩/학습
- Grounding Pack: Bible 유닛 요약 + 루브릭 + 행동 매핑 + 금기 규칙을 묶어 제공
- Runtime: ai.coach/curator가 `knowledge.pack@version` 명시로 호출

### 확장
- A/B 교육 경로: 동일 목표의 다른 유닛 시퀀스 실험
- 현지화: 언어/문화권 별 변형(핵심 루브릭은 동일)
