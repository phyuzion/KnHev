## 메모리 그래프 설계(뉴런형)

### 목적
- 요약(압축된 기억) ↔ 상세(세션/턴/상호작용) 간 왕복
- 시간·주제·감정·행동으로 연결된 그래프 탐색으로 회상/추천/연출을 돕는다

### 노드(Node) 유형
- User, Session, Turn, Summary(Daily/Session), ScenarioPlay, Interaction, EmotionState, Topic, ContentItem, CharacterAction(Animation)

### 엣지(Edge) 유형(방향성)
- Session -[has_turn]-> Turn
- Session -[has_summary]-> SessionSummary
- User -[has_daily]-> DailySummary
- Session -[includes]-> Interaction
- Turn -[mentions]-> Topic
- Session/Day -[emotion]-> EmotionState
- Interaction -[triggers]-> CharacterAction
- ScenarioPlay -[relates_to]-> Topic

### Mongo 매핑
- 정규화 컬렉션(도큐먼트 저장) + `edges` 내역은 대상 컬렉션의 식별자 참조
- 역참조는 인덱스 조합으로 해결. 고빈도 엣지는 도큐먼트 필드에 중복 캐시

### 핵심 쿼리(회상)
- 최근 DailySummary N개 → 관련 SessionSummary 상위 M개 → 필요 시 Session의 Turn 스트리밍 로드
- 토픽 검색 → Turn text index로 세션 집합 → SessionSummary로 요약 제공
- 감정 상태 변화 추적 → EmotionState 시계열 + Interaction/Action 상관 분석

### 저장 규칙
- 이벤트 원장(Event Sourcing) 우선: Interaction/Action/Metric을 세밀 로그로 우선 저장
- 요약은 파생 산출물로 upsert(재계산 가능)

### 성능/비용
- 텍스트 검색: Mongo text index(간단) → 추후 외부 벡터/검색엔진 연동 가능성 열어둠
- 핫 경로: Daily/SessionSummary, 최근 N Sessions 캐시
