## 환경·클래식 BGM 동기화 엔진 설계

### 목표
- 시간대/일출·일몰/날씨/감정 상태에 따라 3D 배경 연출과 클래식 BGM을 동기화
- 대화/행동 맥락에 의해 포지티브 방향으로 점진 전환(분노 증폭 금지)

### 입력 시그널
- 시간/위치: 로컬 시간, 일출·일몰(astro calc)
- 날씨: 비/눈/구름 커버(내부 시뮬레이터 또는 외부 API)
- 감정: `user_metrics`(mood/valence/anxious 등), `emotions` 로그, 대화 의도
- 활동: 리추얼/시나리오/상호작용 강도

### 출력(지시)
- 씬: 라이트(색온도/강도), 하늘/해·달 위치, 포그, 파티클(비/눈/바람), 포스트
- 캐릭터: 에너지 레벨/가드 규칙 반영
- BGM: 클래식 큐 선택/전환(크로스페이드, 볼륨 커브)

### 클래식 BGM 정책
- 장르 범위: 바로크/클래식/낭만 중 저자극 곡 위주(저음/느린 템포)
- 메타: bpm, mode(장·단조), 에너지/발란스, 금기 상황(불안/슬픔 과증폭 금지)
- 전환 규칙: 급작스런 전환 금지, 8–16 bar 단위 크로스페이드, ducking 대화중 -6~-12dB

### 상태기계
- need: calm | sleep | focus | mood_lift | grounding
- regulation: downregulate | stabilize | upregulate
- timePhase: dawn | day | dusk | night
- weather: clear | cloudy | rain | snow
- policy: need/regulation/시간/날씨 매트릭스 → 씬 프리셋 + BGM 후보 랭킹 → 선택

### 데이터 모델 추가
- bgm_tracks: { _id, title, composer, uri, duration_sec, tags: { bpm, mode, energy, valence, safety_level:'S0'|'S1'|'S2' }, license }
- env_presets: { _id, name, timePhase, weather, light, fog, particles, post }
- env_events: { _id, user_id, ts, cause: 'emotion'|'time'|'weather'|'scenario'|'ritual', from:{preset?,track?}, to:{preset?,track?}, params? }

인덱스
- bgm_tracks: { 'tags.energy':1, 'tags.valence':1, duration_sec:1 }
- env_events: { user_id:1, ts:-1 }

### API(tRPC)
- env.getPreset(input:{ time?:string, weather?:'clear'|'cloudy'|'rain'|'snow', state?:{ need?:'calm'|'sleep'|'focus'|'mood_lift'|'grounding'; regulation?:'downregulate'|'stabilize'|'upregulate' }}) → EnvPreset
- env.transition(input:{ toPresetId?:string, toTrackId?:string, reason:string }) → { ok:true }
- bgm.tracks.list(input:{ filter?: any, limit?:number, cursor?:string }) → { items: Track[], nextCursor?:string }
- bgm.tracks.pick(input:{ policy:{ need:'calm'|'sleep'|'focus'|'mood_lift'|'grounding', regulation?:'downregulate'|'stabilize'|'upregulate', timePhase:'dawn'|'day'|'dusk'|'night', weather:'clear'|'cloudy'|'rain'|'snow' }, constraints?:{ max_energy?:number }}) → { trackId:string }
- env.events.log(input:{ cause, from?, to?, params? }) → { ok:true }

### 관측성
- 전환 이벤트 로깅(이전/이후 프리셋·트랙, 이유, 지연)
- 사용자 불쾌 자극 방지 규칙 위반 경보(guard breach)
