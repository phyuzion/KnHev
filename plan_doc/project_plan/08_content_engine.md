## 정서교육 콘텐츠 엔진

### 단계별 구현
1) 카탈로그 구축 → 2) 메타 태깅 → 3) 상태 집계 → 4) 레시피 선택 → 5) 랭커 → 6) 플레이아웃 동기화 → 7) 피드백/학습

### 스키마 핵심
- 타입: music|ambient|voice|activity|card
- 태그: goal/affect/intensity/energy/valence/time_of_day/safety_level 등
- 라이선스: rf|cc|pd|owned|external_link

### 레시피 템플릿(12종)
- A: 불안 완화, B: 기분 상승, C: 집중, D: 수면 전
- 씬 동기화 프리셋과 변주(벚꽃/장마/달빛/억새)

### 스코어링
`S = 0.5M + 0.3P + 0.2C - 1.0X` + 다양성 보정

### KPI
- 세션 완주율 ≥ 60%, 기분↑ ≥ 40%, 스킵 ≤ 15%
