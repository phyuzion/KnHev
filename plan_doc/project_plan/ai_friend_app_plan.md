# 🌐 노킹해븐스도어 (Knocking Heaven's Door) — 상세 기획 & 개발 계획서 (v1)

> 목적: 로우폴리 3D 동물 “정서 동반자” 웹·모바일 서비스의 **제품/기술/운영** 전 영역을 일목요연하게 정리. 이 문서는 설계/개발/운영 팀의 공통 참조 문서이며, Alpha→Launch까지 단계적 실행을 가이드한다.

---

## 0. 핵심 컨셉
**프로젝트명: 노킹해븐스도어 (Knocking Heaven's Door)**
- 약칭: **KHD**, **KnockHD**, 또는 **KnHev** (내부용)
- 패키지/네임스페이스: `com.khd.app` / `com.knocking.heavens.door`
- 슬로건 후보: "내 마음을 부드럽게 두드리는 친구", "마음의 문을 노크하는 동물 친구", "목소리에 반응하는 휴식"
- **한국 문화 레이어**: 한국 토종 동물·사계절·정(情)·눈치·선후배 문화 맥락을 반영한 연출/콘텐츠/퀘스트.

---

## 1. 사용자 여정(UX Journey)
1) **온보딩(1–2분)**: 잔잔한 BGM/검은 화면 → 소프트 질문(나잇대·성향·목표). 
2) **디오라마 진입**: 육각형 숲이 밝아지고, 동물이 등장(성향에 따라 ‘살짝/뿅!’).
3) **대화 세션(10–20분)**: 마이크 허용 → 사용자 발화 → 실시간 SER → 연출&멘트.
4) **데일리 리추얼**: 호흡/바디스캔/감정 레이블링 미션(3–5분). 
5) **7일 커리큘럼**: 주차별 목표(예: 수면/스트레스/자기긍정) 달성 → 씬·행동 Unlock.
6) **리뷰 & 피드백**: 변화 기록/배지/다음 플랜 추천.
7) **안전 플로우**: 위험 신호 시 전문가 연결 경로 제시(앱 내 명확 고지).

---

## 2. 기능 명세 (요약)
- **클라이언트**: 3D 디오라마, 동물 애니/표정, 날씨·효과, 보조 오브젝트(공 등), 대화 UI, 알림/음악 재생.
- **AI/서버**: 대화 이해, SER 요약 융합, 행동 매핑, 커리큘럼 엔진, 안전 감지, tRPC 양방향 스트림.
- **어드민**: 자산(배경/캐릭터/오브젝트) 관리, 포인트(appear/seat/fly…) 편집·미리보기, 사용자/대화/분석, 전문가 연결.

---

## 3. 기술 아키텍처(최종 제안)
### 3.1 클라이언트 계층
- **모바일 앱 셸**: **React Native** (Hermes, RN 0.7x)
  - WebView: `react-native-webview` (iOS WKWebView, Android Chromium)
  - 네비게이션: `@react-navigation/native`
  - 상태관리: **Zustand**(경량) 또는 **Redux Toolkit**(협업 규모↑ 시)
  - 로깅/크래시: Sentry SDK
  - 푸시: FCM(Android), APNs(iOS) → `@notifee/react-native`
  - 결제(추후): IAP(스토어) + Stripe(웹 결제 백업)

- **3D 렌더(웹)**: **Three.js r1xx** (WebGL 2 우선)
  - GLTF 로더 + **KTX2(BasisU)** 텍스처, **Draco** 지오메트리 압축
  - 씬 프레임워크(선택): React Three Fiber(+ Drei) or **바닐라 Three.js**
  - 파티클/날씨: GPU 파티클(Instancing) + 셰이더; 포스트프로세싱 `postprocessing`
  - 경로탐색: **yuka** (NavMesh Graph), 또는 오프라인 NavMesh → Path Graph 변환
  - 물리(선택): `cannon-es`(경량) 또는 `ammo.js`
  - 충돌/지면: Raycaster + Simple Collider Mesh
  - 성능: `gltfpack`/`texture-compressor` 파이프라인, LOD, lazy-load chunks

- **온디바이스 음성(네이티브 모듈)**
  - iOS: **AVAudioEngine** + **Core ML**(mlpackage), **ANE** 우선 / 폴백 GPU/CPU
  - Android: **Oboe/AAudio** + **TensorFlow Lite** (NNAPI/GPU Delegate), `android.permission.RECORD_AUDIO`
  - DSP: RNNoise(웹은 WebAudio WASM 대체), OS NS 우선 사용
  - VAD: WebRTC-VAD(네이티브 포팅) 또는 경량 CNN VAD(≤0.5M)
  - 특징추출: MFCC(32ch, Δ/ΔΔ), F0(YIN/CREPE-lite), Energy, speech rate(음절/무음 비율)
  - SER 모델: **CRNN/Conformer-lite 1–3M, INT8** (TFLite/Core ML Quantization)
  - 브리지: RN <-> Native Module <-> WebView `postMessage`(3–5s 요약)

- **tRPC(WebSocket)**
  - 클라 라이브러리: `@trpc/client`, `ws`, `superjson` 직렬화
  - 전송 전략: **요약 패킷**(3–5s) + 리스크 시 짧은 클립(옵트인)

### 3.2 서버 계층
- **런타임/프레임워크**: Node.js 20 + Fastify + **tRPC v10**
- **LLM 접근**: 우선 **가성비 모델(API)** → 추후 **LoRA/미니 모델** 자가 호스팅
- **세이프티 레이어**: 규칙(키워드/스코어 임계) + 경량 분류기(자해/폭력/의료)
- **실시간**: WebSocket(`ws`) 또는 `uWebSockets.js` (규모↑ 시)
- **캐시/큐**: Redis (요약 버퍼, 일시 큐)
- **DB**: **MongoDB Atlas** (+ Mongoose 또는 Prisma Mongo)
- **스토리지**: **Cloudflare R2(S3 호환)** — GLB/텍스처/오디오, Pre-signed URL 업로드
- **CDN**: **Cloudflare** (정적 에셋, GLB/KTX2/JS 번들)
- **모니터링**: OpenTelemetry + Prometheus/Grafana, 로그는 Loki
- **호스팅**: 시작은 **Render** 단순화 → 확장 시 컨테이너(Kubernetes/EKS) 또는 Fly.io

### 3.4 AI 시스템(요약)
- **MAGI 멀티에이전트**: `Perception(요약/신호) · Coach(응답 초안) · Director(행동/연출 결정) · Curator(지식팩 관리) · Scheduler(계획/과제) · Safety(감시/차단)`
- **Knowledge Pack Lite**: 바이블 고정 대신 얇은 정책·루브릭·액션 매핑 번들. 세션 컨텍스트로 소형 프롬프트에 주입.
- **Autopilot 루프**: `propose → validate → shadow test → promote → observe`(고위험은 휴먼 승인). 실패/회귀 감지 시 자동 롤백.
- **LLM 어댑터**: `Gemini 2.0 Flash` 기본, 환경변수로 `OpenAI/Llama` 전환. 시스템 프롬프트는 모델별 권장 형식 사용.
- **MCP 연동**: 서버는 MCP 서버(툴 제공), 에이전트는 MCP 클라이언트로 내부 툴(API) 호출 일관화.


### 3.3 데이터 플로우(핵심)
- 클라(네이티브 SER 요약) → `audio.streamClientStats`
  - `{window_id, ts, pitch_mean, pitch_var, energy_mean, energy_var, mfcc32_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score}`
- 서버(LLM 융합 판단) → `dialogue.streamIntent`
  - `{intent: approach_slow|step_back|comfort_pose|surprise_jump|land_on_rock|peek_from_rock, expr: happy|sad|angry|surprised|neutral, anim: walk|run|jump|fly|land, target: point_name|offset, fx?: weather|bgm|sfx}`
- 3D(WebView)에서 반영: 씬은 고정, 캐릭터/효과만 갱신

---

## 4. 3D 씬 설계
### 4.1 씬 계층 구조
- **배경(Background)**: 육각형 디오라마 GLB, Skybox/라이트, 지면 콜리전
- **캐릭터(Animals)**: 종별 GLB(본/애니/블렌드셰이프)
- **날씨(Weather)**: GPU 파티클, 볼륨 포그(선택)
- **보조 오브젝트(Props)**: 공/열매/막대기 등(물리)

### 4.2 한국 토종 동물 라인업(초안)
- **호랑이**(수호/용기): 접근은 느리고 위엄, 위로·안전 지향 행동
- **너구리(라쿤독)**(유머/재치): `peek_from_rock`, `play_with(prop)` 강점
- **수달**(호기심/놀이): 물가 씬에서 강함, `forage`, `roll`
- **고라니/노루**(섬세/경계): `step_back` 빈도↑, `idle_listen`
- **반달가슴곰**(포용/안정): `comfort_pose`, `hug-like` 제스처(상징화)
- **삵/여우**(민첩/관찰): `orbit_user`, `head_tilt` 빈도↑
- **두루미/까치/제비**(희망/소식/봄): `fly/land`, `bring_item` 연출
- **부엉이**(사색/밤): 야간 씬, `idle_nearby`, `look_around`

> 종별 **감정→행동 파라미터** 기본값을 별도 테이블로 유지(Stop distance, 속도, 제스처 세트).

### 4.3 한국 사계절·장면 프리셋
- **봄/벚꽃**: 꽃잎 파티클, 밝은 톤, 바람 약간
- **여름/장마**: 비/물방울 반사, 소리↑, 조도↓
- **가을/억새**: 노을/황금톤, 잎사귀 낙엽
- **겨울/첫눈**: 큰 눈송이, 소리↓, 포그↑

### 4.4 에셋 파이프라인(권장)
- DCC: **Blender** (리깅/모션 병합) → **glTF/GLB** Export
- 최적화: **gltfpack**(메시/애니), **Draco**(지오), **KTX2(BasisU)**(텍스처)
- 텍스처: PNG → KTX2, normal/roughness/metallic 분리 유지
- 검증: glTF Validator, 웹 프리뷰(three-gltf-viewer)

### 4.5 포인트 시스템(어드민 편집 대상)
- 스키마: `{ name, type(appear|seat|fly|land|hide|pathNode), position:[x,y,z], rotation?, radius?, meta{…} }`
- 저장: **MongoDB `scene_configs` 컬렉션**(버전 필드 포함)
- 프리뷰: Admin의 WebGL 뷰어(React + R3F)로 즉시 확인

### 4.6 경로·이동
- NavMesh → Path Graph 변환(에디터 스크립트) or **yuka** 탐색
- 지면 고도: **Raycaster**로 Y 보정, 발자국/먼지(선택)

### 4.7 날씨/효과
- **비/눈**: Instanced particles, GPU 업데이트
- **안개/포그**: ExponentialFog or Volumetric(성능 주의)
- **라이트**: Hemisphere + Directional, 낮/밤 전환 애니메이션

---

## 5. 캐릭터 애니/표정
- **GLB 내부**: Idle/Walk/Run/Jump/Fly/Land/LookAround/Surprised 등 다중 클립
- **표정**: Blendshape(웃음/놀람/분노/슬픔) + 귀/꼬리/날개 본 제어
- **공통 감정 레이어 → 종별 매핑**: happy/sad/angry/surprised/neutral

---

## 6. 음성 처리(온디바이스)
### 6.1 파이프라인
- 16kHz Mono → **VAD**(WebRTC-VAD/CNN-VAD) → **Noise Suppression**(RNNoise/OS NS) → **Feature**(MFCC 32ch, Δ/ΔΔ, F0(YIN/CREPE-lite), Energy, speech rate) → **SER(1–3M, INT8)** → **3–5s 요약**(250–800B)
- 임계치/스무딩: EMA로 단기 변동 흡수, 히스테리시스 적용
- 이벤트 패킷: `{ts, pitch_mean/var, energy_mean/var, mfcc_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score}`

### 6.2 모델/런타임
- **iOS**: Core ML + ANE(지원 단말), 배포는 `.mlpackage`/Core ML Tools 변환, quantization aware training or post-training quant
- **Android**: TensorFlow Lite + NNAPI/GPU Delegate, **Dynamic Range/INT8** 양자화
- **웹 프리뷰**: ONNX Runtime Web(WASM)로 데모 수준만(실서비스는 네이티브)

### 6.3 폴백·배터리 전략
- Delegate 우선순위: ANE/NPU ▶ GPU ▶ CPU
- 저전력 모드: 윈도↑/업데이트 주기↓/특징 차원↓, 화면 오프 시 VAD만
- 옵트인 샘플 업로드: 리스크 플래그 시 최근 10–20s Opus 전송

### 6.4 품질 관리
- 벤치: 내부 데이터 + 공개 코퍼스(SER) 주기 측정
- 편향/안전: 성별/연령/방언별 결과 점검, 휴먼 검토 루프

---

## 7. 대화 해석 & 행동 매핑(백엔드)
### 7.1 라우터(개념 명세)
- `scene.setup(input)` → 배경/날씨/포인트/오브젝트 초기 로드
- `scene.update(input)` → 씬 교체/날씨 변경 등(희소하게 호출)
- `audio.streamClientStats.subscribe()` → 클라 요약 수신(WebSocket)
- `dialogue.streamIntent.subscribe()` → 서버→클라 캐릭터 지시 스트림
- `character.spawn/control/follow` → 등장/이동/추적 지시(서버 생성 이벤트)
- `admin.assets.upload/list` → 자산 업/목록(Pre-signed)
- `admin.points.crud` → 포인트 CRUD + 미리보기 데이터
- `admin.users.logs` → 사용자 세션/요약/행동/리스크 로그
- `risk.flag/alert` → 위험 플래그/알림·관리자 구독

### 7.2 행동 매핑 레이어
- 입력: SER 요약 + (옵션) ASR + 사용자 컨텍스트(최근 정서/수면/스트레스/선호)
- 판단: LLM + 규칙(가중치/임계) → **의도(Intent)** 산출
- 매핑: Intent → 캐릭터 지시(이동/애니/표정/효과)
- 예: `anxious_high` → `approach_slow`, `expr:concern`, `anim:walk_slow`

### 7.3 세이프티
- 키워드/톤 급변/무음 급증 규칙 + 모델(자해/자살) → 즉시 `risk.flag`
- 사용자 고지/옵션: 기관 연결/보호자 호출/긴급 연락처 안내
- 관리자 알림: 이메일/슬랙/콘솔 대시보드

### 7.4 행동 매핑 테이블(요약)
(기존 표 유지)

### 7.5 아이들(Idle) 시스템 설계
(기존 내용 유지)

### 7.6 **한국형 ‘은밀 퀘스트(스텔스 퀘스트)’ 시스템**
> 사용자는 자연스러운 동물의 이야기/부탁을 듣는다. 실제로는 **사회정서학습(SEL) 평가/강화**가 동작한다.

**목표 SEL 역량(축)**
- 공감(인지/정서), 배려, 경계 설정(거절·한계), 도움 요청/연결, 갈등 해결, 책임/수정(사과·복구), 디지털 시민성(사이버불링 대처)

**한국 맥락 테마(예시)**
- 학교/입시 스트레스, **왕따/단체 카톡 따돌림**, 선배/후배 문화, 회식/모임에서의 경계, 가족 기대·소통, 첫눈/장마 등 사계절 정서

**퀘스트 구조(노드 기반)**
1) **Hook**: 동물의 짧은 사연 — 예) "내 친구 **너구리**가 단톡에서 놀림을 당하고 있어… 들어줄래?"
2) **탐색**: 사용자의 반응 수집(음성/텍스트). LLM이 공감/판단/행동 의지 신호를 분석.
3) **분기**: 선택지 or 자연어 응답 → 보조 질문(정보 확인·경계·도움 요청 방법 등)
4) **결론/리플렉션**: 핵심 원칙 요약 + 실제 생활 팁 카드 1장
5) **보상/연출**: 씬 변화(벚꽃/달빛 등), 동물 제스처, 배지(정·배려·용기)

**평가 루브릭(자동 스코어링)**
- 신호: 공감 표현(감정 명명, 경청), 해결 전략 제안(구체성), 안전성(2차 가해 회피), 경계 설정 언급, 도움 요청/연결 고려
- 등급: `E0(미흡)~E3(우수)` → **SEL 히트맵** 업데이트(개인화 반영)

**샘플 퀘스트 1 — "단톡 놀림, 내가 뭘 할 수 있을까?"**
- Hook: 까치가 말한다. "너구리가 단톡에서 별명으로 놀림을 받고 있대…"
- 핵심 분기:
  - (A) 감정 인정 + 사실 확인: "너구리는 어떤 기분일까?" → 공감 스코어↑
  - (B) 개입 전략: 사적 메시지 위로, 관리자 신고, 가해 메시지 비난 대신 **행동 규범 상기**
  - (C) 본인 안전: 역공격/불붙이기 회피, 필요 시 어른/기관 연결 제안
- 끝맺음: 카드 "사이버불링 3단계 대응" + 씬: 장마 끝 무지개, 동물 `comfort_pose`

**샘플 퀘스트 2 — "선배의 무리한 부탁"**
- Hook: 여우가 말한다. "선배가 숙제를 대신 해달래…"
- 분기: (A) 경계 설정 문장 연습, (B) 대안 제시, (C) 도움 요청(담임/학과 조교)
- 씬: 억새 바람(자립 상징), 동물 `step_back → nod`

**샘플 퀘스트 3 — "밤에 잠이 오지 않아"**
- Hook: 부엉이. 시험 앞두고 뒤척이는 친구 이야기
- 분기: 수면 위생 팁 선택, 자기비난 멈춤 문장, 늦은 카페인 회피
- 씬: 달빛 프리셋, `idle_lie`

**윤리/투명성**
- 온보딩에 **교육적 목적 및 평가 사용**을 부드럽게 고지(옵트인). 개인 판단 낙인 금지, **피드백은 성장 관점**으로.
- 위험 진술은 즉시 세이프티 플로우로 전환.

**어드민 저작툴(퀘스트 스튜디오)**
- 노드 에디터: Hook/질문/분기/피드백 노드 배치, 한국 테마 프리셋 적용
- 루브릭 빌더: 키 시그널 체크박스(공감/경계/안전/도움요청 등), 점수 가중치 설정
- 미리보기 & 음성 합성(보이스 오버 샘플), 배지/연출 바인딩

---|---|---|---|
| `anxious ≥0.7` or `speech_rate↑, pitch_var↑` | `approach_slow`, `breathe_slow`, `comfort_pose` | `surprise_*` 금지 | speed=0.6, stop_dist=1.2m, expr=concern(0.6) |
| `sad ≥0.6`, `energy↓`, `vad_ratio↑` | `approach_slow`, `idle_sit` 근처, `head_tilt` | `orbit_user` 억제 | hold=4–6s, voice_soft |
| `angry ≥0.6`, `energy↑` | `step_back`, `look_around`(거리 유지) | `approach_*` 억제 | stop_dist=2.0m, expr=neutral(0.4) |
| `happy ≥0.6`, `speech_rate↑` | `orbit_user`, `tail_wag/wing_flap`, `peek_from_rock`(가벼움) | — | orbit_radius=1.0m, anim=run_light |
| `surprised ≥0.5` | `surprise_jump`(짧게), `look_around` | `step_back` 과도 금지 | jump_height=0.3, cooldown=10s |
| `neutral` (기본) | `wander_random`, `look_around`, `play_with(prop)` | — | radius=1.5–3m, dwell=2–5s |
| **ritual 단계** | `go_to(seat_point)`, `idle_sit`, `breathe_slow` | 놀래킴 금지 | tempo=slow, bgm=calm |
| **cooldown** | `idle_lie`, `groom`, `look_around` | 고에너지 억제 | light_dim, anim_loops↓ |

**파라미터 기본값(종별 보정)**
- `stop_dist`: 토끼 1.0m / 호랑이 1.5m / 새(착지) 0.8m
- `speed`: walk_slow 0.6, walk 1.0, run 1.8 (m/s 상응 비율)
- `expr` 강도: 0–1 (blendshape/본 가중치)
- `cooldown`: 놀람 10–20s, 접근 5–8s, 놀기 15–30s

### 7.5 **아이들(Idle) 시스템 설계**
> 사용자가 조용하거나 입력이 없을 때도 **생동감 유지**. 확률·쿨다운·상황 인지 기반 스케줄러.

**구성요소**
- **Idle FSM**: `idle_base → explore → micro_gesture → interact_prop → rest` 전이
- **스케줄러**: 4–8s마다 평가, 가중치로 다음 행동 선택(감정·시간·환경으로 가중치 조정)
- **마이크로 제스처**(3–7s 주기): `head_tilt`, `ear_twitch`, `tail_wag_small`, `blink`, `breath`
- **탐색 경로**: `pathNode` 그래프 기준 소규모 이동(0.5–2.0m), 랜덤 dwell
- **소품 상호작용**: `prop_near<1.5m`이면 `play_with(prop)` 확률↑(기본 0.25)
- **휴식 루프**: 장시간 입력 없음(>60s) → `idle_sit/lie`로 전이, 간헐 `look_around`

**아이들 가중치 표(예)**
| 상태 | explore | micro_gesture | interact_prop | rest |
|---|---:|---:|---:|---:|
| neutral | 0.35 | 0.40 | 0.15 | 0.10 |
| happy | 0.45 | 0.35 | 0.15 | 0.05 |
| sad | 0.20 | 0.45 | 0.05 | 0.30 |
| anxious | 0.15 | 0.50 | 0.05 | 0.30 |
| cooldown | 0.10 | 0.35 | 0.05 | 0.50 |

**가드/쿨다운 규칙**
- 고에너지 행동(orbit/run/surprise)은 10–30s 쿨다운
- 위험/불안 상태에서는 `surprise_*` 금지, `approach`도 속도 제한
- 동일 행동 반복 방지: 최근 3회 중복시 weight 70% 감소

**명세 스키마(튜너블)**
```json
{
  "behavior": "wander_random",
  "guards": {"state_not_in": ["angry_high"], "cooldown_sec": 8},
  "weight": {"neutral": 0.35, "happy": 0.45, "sad": 0.2},
  "params": {"radius_min": 1.0, "radius_max": 3.0, "dwell_sec": [2,5]},
  "anim": {"quadruped": "Walk", "bird": "Hop", "dragon": "Walk"},
  "expr": {"neutral": 0.2}
}
```

**클라이언트 동작**
- 5s tick마다 서버 의도 없으면 Idle 스케줄러 가동 → 로컬 행동 결정(부하↓)
- 서버 의도가 도착하면 즉시 선점(Idle 중단) → 캐릭터 제어 반영

**어드민 튜닝 포인트**
- 상태별 가중치·쿨다운·파라미터 실시간 조정, 프리뷰 재생
- 종별 애니 매핑 테이블(동일 행동명→각 GLB 클립명) 관리

---

## 8. 커리큘럼(7일)·리추얼
- **주차 목표**: 수면/스트레스/자기긍정 등 테마별 미션·피드백
- **일일 리추얼**: 호흡 1분·바디스캔·감정 레이블링·짧은 저널링
- **보상**: 씬 변화(날씨·빛·식생), 행동/포인트 Unlock, 배지
- **주말 리뷰**: 지난 7일 변화 시각화·다음 플랜 추천

---

## 8+. 정서교육 콘텐츠 엔진 (상세 설계 v1)
> 목표: 사용자 상태(음성 감정+컨텍스트)에 맞춰 **미니 세션 레시피**를 구성·추천·재학습하는 엔진을 단계별로 구현. **한국 문화 레이어**와 연동.

### 8+.1 단계별 구현 플로우 (Step by Step)
**Step 1 — 카탈로그 구축**
1) **타입 정의**: `music | ambient | voice | activity | card`
2) **소스 수집**: 로열티-프리 앰비언트/노이즈·내장 보이스·텍스트 카드 위주(초기)
3) **라이선스 등록**: `license{type, source, terms_url, expiry}`
4) **파일 업로드**: Cloudflare R2 + Cloudflare CDN, 오디오는 `opus 48k`, 이미지 `webp`, 자막 `vtt`

**Step 2 — 메타데이터 태깅**
1) 필수: `target_goal, affect_direction, intensity, energy, valence, duration_sec, locale`
2) 음악 전용: `bpm, mode(major|minor|modal)`
3) 안전: `contraindications, safety_level(S0~S3)`
4) 기기: `device_ok(low_end|high_end)`
5) **한국 레이어 태그**: `korean_theme:[사계절|장마|첫눈|한강바람|산사|달빛|벚꽃|억새]`, `instrument:[가야금|대금|해금|꽹과리|장구]`, `folklore:[호랑이|까치|두루미|제비]`

**Step 3 — 상태 집계(State Aggregator)**
- 입력: `SER(emotion,intensity)`, `speech_rate`, `vad_ratio`, `time_of_day`, `self_report`, `history`
- 출력: `state = { need: calm|sleep|focus|mood_lift|grounding, level:1..3, risk:0..1 }`

**Step 4 — 레시피 선택(Recipe Selector)**
- 맵핑: `state.need@time_of_day@korean_theme?` → **레시피 템플릿** 선택
- 길이 조정: 사용자 선호/가용시간 기반 `duration_adj`

**Step 5 — 후보 랭킹(Candidate Ranker)**
- 메타 필터 → 스코어링(아래 8+.4) → Top-K 선택

**Step 6 — 바인딩/플레이아웃**
- 3D 씬 연출 동기화(색온도/광량/포그/동물 행동)
- **한국 테마 프리셋** 적용(벚꽃바람, 장마비, 달빛 등)
- 페이드 인/아웃, 볼륨 커브, 텍스트/자막 표시 타이밍

**Step 7 — 피드백·학습**
- 신호: 완주율, 스킵, 만족도, 기분변화(↑/→/↓)
- 정책: 기준치 미달 시 자동 대체 레시피, 장기적 개인화 가중치 업데이트

---

### 8+.2 콘텐츠 스키마 (세부)
```ts
type Content = {
  id: string;
  type: 'music'|'ambient'|'voice'|'activity'|'card';
  title: string; locale: 'ko'|'en';
  duration_sec: number; uri?: string; image_uri?: string; vtt_uri?: string;
  tags: {
    target_goal: ('calm'|'sleep'|'focus'|'mood_lift'|'grounding')[];
    affect_direction: 'downregulate'|'upregulate'|'stabilize';
    intensity: 1|2|3|4|5;
    energy?: 1|2|3|4|5; valence?: 1|2|3|4|5;
    bpm?: number; mode?: 'major'|'minor'|'modal';
    cultural_context?: ('kr'|'en'|'jp'|'global')[];
    contraindications?: string[];
    time_of_day?: ('morning'|'afternoon'|'evening'|'night')[];
    device_ok?: ('mobile_low_end'|'mobile_high_end'|'desktop')[];
    safety_level: 'S0'|'S1'|'S2'|'S3';
    korean_theme?: ('사계절'|'장마'|'첫눈'|'한강바람'|'산사'|'달빛'|'벚꽃'|'억새')[];
    instrument?: ('가야금'|'대금'|'해금'|'꽹과리'|'장구')[];
    folklore?: ('호랑이'|'까치'|'두루미'|'제비')[];
  };
  license: { type: 'rf'|'cc'|'pd'|'owned'|'external_link'; source?: string; terms_url?: string; expiry?: string };
};
```

---

### 8+.3 레시피 템플릿 (12종, 한국 테마 변주)
- 모든 레시피에 `korean_theme_variant` 옵션: 예) A1(장마), B1(벚꽃), D1(달빛)
- 악기/사운드 교체 규칙: 가야금/대금 기반 앰비언트로 대체 가능(자극도 유지)

... (기존 A/B/C/D 레시피 표기는 유지)

---

### 8+.4 랭킹/스코어링 수식 (초안)
(변경 없음) + `korean_theme_preference` 가중치(유저 선택 시)

---

### 8+.5 씬 동기화 프리셋 (한국 테마 추가)
- `벚꽃`: 바람 입자 + 꽃잎 파티클, 색온도 +500K, 동물 `orbit_user`
- `장마`: 비/웅덩이 리플, 광량 -20%, 동물 `approach_slow`
- `달빛`: 블루 틴트, 별 + 미세 포그, 동물 `idle_nearby`
- `억새`: 황금빛 노을, 잔바람, 동물 `look_around`

---

### 8+.2 콘텐츠 스키마 (세부)
```ts
type Content = {
  id: string;
  type: 'music'|'ambient'|'voice'|'activity'|'card';
  title: string; locale: 'ko'|'en';
  duration_sec: number; uri?: string; image_uri?: string; vtt_uri?: string;
  tags: {
    target_goal: ('calm'|'sleep'|'focus'|'mood_lift'|'grounding')[];
    affect_direction: 'downregulate'|'upregulate'|'stabilize';
    intensity: 1|2|3|4|5;
    energy?: 1|2|3|4|5; valence?: 1|2|3|4|5; // 음악/앰비언트
    bpm?: number; mode?: 'major'|'minor'|'modal';
    cultural_context?: ('kr'|'en'|'jp'|'global')[];
    contraindications?: string[]; // panic_sensitive, grief_sensitive 등
    time_of_day?: ('morning'|'afternoon'|'evening'|'night')[];
    device_ok?: ('mobile_low_end'|'mobile_high_end'|'desktop')[];
    safety_level: 'S0'|'S1'|'S2'|'S3';
  };
  license: { type: 'rf'|'cc'|'pd'|'owned'|'external_link'; source?: string; terms_url?: string; expiry?: string };
};
```

---

### 8+.3 레시피 템플릿 (12종, 변주 포함)
> 각 레시피는 단계별 슬롯을 가진다: `steps[]` (type, tag 필터, 길이 범위, 씬 연출 프리셋)

**A. 불안 완화 (3종)**
- **A1. 빠른 안정(5–7분, 밤/저녁)**
  1) `voice: 호흡 4-7-8 (90–120s)`
  2) `ambient: rain/waves, bpm<60, energy≤2 (240–300s)`
  3) `voice: 안정 멘트(30–60s)`
  - 씬: 포그↑, 조도↓, `approach_slow → idle_sit`, 색온도 3000K
- **A2. 호흡+자연(7–9분, 전 시간대)**
  1) `activity: 호흡(120s)` → 2) `ambient: forest(300s)` → 3) `card: 그라운딩 팁(60s)`
- **A3. 저자극 수면연결(10–12분, 밤)**
  1) `voice: 천천히 숨(120s)` → 2) `ambient: drone pad(420s)` → 3) `voice: 마무리(60s)`

**B. 기분 상승 (3종)**
- **B1. 라이트 업(6–8분, 오후)**
  1) `card: 감정 라벨링(60s)` → 2) `music: lofi major, bpm 80–95(240–300s)` → 3) `activity: 바디스캔 라이트(60–90s)`
  - 씬: 광량↑, 바람↑, `orbit_user`, 꼬리/날개 제스처
- **B2. 클래식 스파크(7–9분)**
  1) `voice: 긍정 자기대화(60s)` → 2) `music: 클래식 장조, 빠르기 Andante(300s)` → 3) `card: 감사 3가지(60s)`
- **B3. 리듬 웍(8–10분)**
  1) `activity: 가벼운 리듬 호흡(90s)` → 2) `music: light groove bpm 90–105(300–360s)` → 3) `voice: 마무리(30–60s)`

**C. 집중 (3종)**
- **C1. 노이즈 포커스(10–12분)**
  1) `card: 소음 차단 습관(60s)` → 2) `ambient: brown/pink noise(540s)` → 3) `voice: 리마인드(30s)`
  - 씬: 카메라 고정, 동물 `idle_nearby`
- **C2. 미니멀 피아노(12–15분)**
  1) `voice: 목표 선언(30s)` → 2) `music: minimal piano, bpm 70–85(600–780s)` → 3) `card: 25분 타이머 팁(60s)`
- **C3. 호흡+집중(8–10분)**
  1) `activity: box breathing 4-4-4-4(120s)` → 2) `ambient: steady pad(360–420s)` → 3) `card: 산만함 다루기(60s)`

**D. 수면 전 (3종)**
- **D1. 나이트 릴리즈(12–15분)**
  1) `voice: 근육 이완(120s)` → 2) `ambient: slow drone(600s)` → 3) `voice: 감사 한 줄(60s)`
  - 씬: 별/하늘, 동물 `idle_lie`, BGM -12dB
- **D2. 빗소리 수면(15–20분)**
  1) `voice: 호흡(120s)` → 2) `ambient: rain loop(780–1080s)`
- **D3. 파도 수면(12–18분)`**
  1) `card: 수면 위생 팁(60s)` → 2) `ambient: ocean waves(600–960s)`

— 각 레시피는 `fallback`을 가진다(예: 음악 로드 실패 → ambient 대체, 혹은 길이 단축 버전).

---

### 8+.4 랭킹/스코어링 수식 (초안)
**기본 점수** `S = w_m * M + w_p * P + w_c * C - w_x * X`
- `M(매칭)` = 태그 일치도
  - `goal_match ∈ {0,1}`, `affect_match ∈ {0,1}`, `intensity_penalty = |intensity - need.level|/4`
  - `M = 0.5*goal_match + 0.3*affect_match + 0.2*(1-intensity_penalty)`
- `P(개인화)` = 사용자 선호·완주율·최근 반응
  - `P = 0.4*finish_rate + 0.3*like_score + 0.2*(1-skip_rate) + 0.1*recent_uplift`
- `C(컨텍스트)` = 시간대/기기/문화 적합성(가중 합)
- `X(제약)` = 금기/안전/중복 패널티 (금기는 무한대)

기본 가중치 예: `w_m=0.5, w_p=0.3, w_c=0.2, w_x=1.0`

**탐욕적 선택 → 다양성 보정**
- Top-K 선택 후 **유사도 중복 페널티**(장르/템포/키/아티스트 유사도)로 다양성 확보

---

### 8+.5 씬 동기화 프리셋
- `downregulate`: 조명 -30%, 색온도 3000K, 포그+20%, 동물 `approach_slow/idle_sit`
- `upregulate`: 조명 +25%, 바람+30%, 동물 `orbit/tail_wag/wing_flap`
- `stabilize`: 카메라 고정, 동물 `idle_nearby`, 포스트 최소화

---

### 8+.6 어드민 툴 (콘텐츠 스튜디오)
- **카탈로그**: 목록/검색/필터(태그·길이·언어·안전레벨), 일괄 태깅
- **레시피 빌더**: 드래그&드롭 시퀀서(스텝 추가/조건/길이범위), 프리뷰 재생
- **A/B 실험**: 그룹/기간/표본, KPI(완주율·기분상승·스킵율) 자동 비교, 승격 버튼
- **검수**: 안전 레벨 검사, 금칙어/콘텐츠 라벨 충돌 경고, 저작권 필수 항목 체크

---

### 8+.7 텔레메트리 & KPI
- **세션 단위**: 완주율, 평균 재생 길이, 스킵률, 만족도(별점 1–5), 기분 변화(↑/→/↓)
- **레시피 단위**: 선택률, 승률(기분↑ 비율), 중도 이탈 패턴
- **사용자 단위**: 요일/시간대 패턴, 선호 장르, 리텐션 영향
- 목표: `세션 완주 ≥ 60%`, `기분↑ ≥ 40%`, `스킵 ≤ 15%`

---

### 8+.8 정책/안전/라이선스
- **링크-아웃**: 외부 스트리밍 서비스는 딥링크만(재생/권리는 플랫폼에 위임)
- **자체 호스팅**: 로열티-프리/자체 제작 위주, 메타에 출처/권리 명시
- **안전 레벨**: `S3`(전문가 필요)는 기본 제외, 옵트인/경고 필요
- **민감 상황 회피**: `panic_sensitive`, `grief_sensitive` 태그 교차 필터

---

### 8+.9 로드맵 (콘텐츠 관점)
- **M1(4주)**: 카탈로그 100개(ambient/voice/card 중심), 레시피 12종, 랭커 v1
- **M2(8주)**: A/B 시스템, 개인화 가중치 업데이트, 한국어 보이스 확장
- **M3(12주)**: 장르 확장(클래식 실연 라이선스), 문화권별 로컬라이즈

---

## 9. 어드민/관리자
### 9.1 기술 스택
- **Admin 앱**: Next.js 15(App Router) + TypeScript + Tailwind 4.1 + shadcn/ui
- 3D 프리뷰: **React Three Fiber** + drei + glTF 뷰어 컴포넌트
- 인증/권한: **Clerk/Auth0** or 자체(JWT + RBAC: Admin/Operator/Reviewer)
- 업로드: S3 Pre-signed + 드래그&드롭, 진행률/버전링
- 감사/감시: Audit Log(Postgres + Log retention), IP allowlist(선택)

### 9.2 자산/포인트 관리
- 자산 테이블: `Asset(id, type[background|skybox|prop|audio|fx|character], uri, version, meta)`
- 포인트 CRUD UI: 테이블 + 3D 인스펙터(좌표/반경/타입/메타), 스냅/그리드
- 스테이지 배포: Dev/Alpha/Beta/Prod 분리, Promote 버튼

### 9.3 사용자/세션/리스크
- 사용자 카드: 최근 세션, SER 타임라인, 리스크 플래그 이력
- 세션 재현: (옵트인) 10–20s 오디오 클립 + 캐릭터 지시 로그 플레이백
- 리포트: 리텐션/세션 길이/완주율/전환율, 모델 비용/유저, 리스크 발생률

### 9.4 전문가 네트워크
- 디렉터리: 기관/전문가(지역/분야/가용시간)
- 매칭 워크플로우: 사용자 동의→연결→후속 메모/상태
- 보안: 민감정보 필드 암호화, 접근권한 분리

---

### 9.5 **AI 보조 배경 제작(1–4) — Admin 통합 워크플로우**
> 목표: 배경 제작의 ①스카이박스 생성 ②모듈 자산 생성 ③스캔 임포트 ④배경 애니/효과 구성을 **어드민에서 직접 수행**

#### (1) 스카이박스 생성(360°)
- 패널: **Skybox Studio**
  - 입력: 텍스트 프롬프트, 스타일(로우폴리/수채화/실사), 시간대(아침/노을/밤), 날씨(맑음/비/눈)
  - 작업: 외부 생성 API 호출(예: Skybox AI) → 8K/4K HDRI 수신 → 자동 **KTX2** 변환 → 미리보기(구면/큐브맵)
  - 저장: `Asset(type=skybox, uri, hdr=true, meta{prompt, seed, style})`
  - 버튼: Set Default / Replace / Promote(스테이지 배포)

#### (2) 모듈 자산(Text→3D)
- 패널: **Module Builder**
  - 카테고리: tree/rock/log/bridge/grassCluster 등 프리셋 + 프롬프트
  - 작업: 외부 생성 API(예: Meshy/Scenario/Kaedim) 호출 → GLB 수신
  - 파이프라인 자동화: **gltfpack → Draco → KTX2** → 콜리전 단순화(저폴리 프록시) → 썸네일 생성
  - 메타: LOD 레벨, 폴리카운트, 콜리전 타입(mesh/box/sphere)
  - 승인 플로우: Reviewer 승인 후만 **Prod Promote** 가능(RBAC)

#### (3) 스캔 임포트(Nerf/Photogrammetry)
- 패널: **Scan Import**
  - 입력: 폰 스캔(Polycam/Luma) 업로드 or URL → GLB/OBJ 변환
  - 클린업: 자동 디시메이션/리토폴로지 옵션, 텍스처 리프로젝션, 스케일 정규화(1m=1단위)
  - 충돌/네비: 지면 추정 → 단순 콜리전 생성 → 선택 시 NavMesh Graph 변환(오프라인 잡)
  - 검수: Holes/Non-manifold 검사, 경고 표시

#### (4) 배경 애니/효과 구성
- 패널: **FX Composer**
  - 날씨 프리셋: 비/눈/안개/바람 강도 슬라이더, 색온도·라이트 세트
  - 파티클: GPU instancing, 방출률/중력/속도 커브 편집기
  - 포스트: Bloom/Color Grading(성능 가이드 표시), 낮/밤 전환 타임라인
  - 프리뷰: 실시간 WebGL 뷰 + FPS/메모리 패널
  - Export: 씬 FX 프리셋 저장 → SceneConfig에 참조

#### (공통) 배경 배치 & 포인트 편집
- **Diorama Editor**: 육각형 박스 템플릿 위에 모듈 드래그&드롭 배치
- 포인트 편집: appear/seat/fly/land/hide/pathNode 생성·이름·반경, 3D 기즈모
- 내보내기: `SceneConfig(points[], props[], fxPreset)` 저장, 버전 태깅

#### (안전/운영)
- 비용/호출 제한: 생성 API Key 암호화 저장, 사용자별/일별 쿼터
- 저작권/정책: 업로드·생성물에 대한 사용권 체크박스(정책 동의) + 필터(금칙어/불법물)
- 품질 보증: 자동 검사(폴리/텍스처 용량 한계, 머티리얼 수), 실패 리포트
- 롤백: 각 자산/씬 버전별 Rollback, Diff 뷰(변화 요약)

> **주의**: 캐릭터(동물)은 **민감/품질 중요** 영역이므로 **어드민 자동 생성 금지**. **전담 아티스트 수동 제작** + 검수 워크플로우만 허용.

---

## 10. 데이터 모델(개념)
- **User**(id, email?, locale, profile, consent_flags, created_at)
- **Session**(id, user_id, device_info, t_start, t_end, notes)
- **AudioWindow**(id, session_id, t0,t1, pitch_mean, pitch_var, energy_mean, energy_var, mfcc32_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score, clip_ref?)
- **DialogueTurn**(id, session_id, role[user|ai], text?, intent, action_decision, character_state_before/after, created_at)
- **SceneConfig**(id, background_asset_id, weather, points[], props[], version, stage)
- **Asset**(id, type, uri, version, size, hash, meta)
- **Point**(id, scene_id, name, type, position[x,y,z], rotation?, radius?, meta)
- **CurriculumPlan**(id, theme, day_steps[]) / **Progress**(user_id, plan_id, day, status, metrics)
- **Expert**(id, org, region, specialty, slots) / **Referral**(user_id, expert_id, status, created_at, notes)
- **AuditLog**(id, actor_id, action, resource, before, after, ts)

인덱스: user_id/timestamps, 세이프티 이벤트(risk_score>idx), 자산 해시(unique)

--- 데이터 모델(개념)
- **User**(id, email?, locale, profile, consent_flags, created_at)
- **Session**(id, user_id, device_info, t_start, t_end, notes)
- **AudioWindow**(id, session_id, t0,t1, pitch_mean, pitch_var, energy_mean, energy_var, mfcc32_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score, clip_ref?)
- **DialogueTurn**(id, session_id, role[user|ai], text?, intent, action_decision, character_state_before/after, created_at)
- **SceneConfig**(id, background_asset_id, weather, points[], props[], version, stage)
- **Asset**(id, type, uri, version, size, hash, meta)
- **Point**(id, scene_id, name, type, position[x,y,z], rotation?, radius?, meta)
- **CurriculumPlan**(id, theme, day_steps[]) / **Progress**(user_id, plan_id, day, status, metrics)
- **Expert**(id, org, region, specialty, slots) / **Referral**(user_id, expert_id, status, created_at, notes)
- **AuditLog**(id, actor_id, action, resource, before, after, ts)

인덱스: user_id/timestamps, 세이프티 이벤트(risk_score>idx), 자산 해시(unique)

---

## 11. 보안·프라이버시·세이프티
- **프라이버시 기본**: 원시 오디오 기본 미송신, 요약 지표 중심. 클립 업로드는 옵트인(명확 동의)
- **암호화**: 전송 TLS 1.2+, 저장 시 PII 필드 KMS 암호화, 비밀번호는 Argon2
- **접근통제**: RBAC, 관리자 IP allowlist, 세션 만료/재인증
- **감사**: AuditLog 전면, 민감 이벤트 경보
- **세이프티 룰**: 자해/폭력/의학적 조언 차단 가드레일, 위험 시 플래그→연결
- **데이터 보존**: 요약/메타 12개월, 오디오 클립(옵트인) 30일 이하 기본

---

## 12. 성능 목표(모바일)
- SER 윈도 3–5s, **엔드투엔드 반응 250–800ms**(상위 단말 기준)
- 3D: 30–60 FPS(상위)/24–30 FPS(중급), 초기 로딩 < 3–5s(3G/4G), 지연 로딩 Asset 분할(Addressable/GLTF chunk)
- 배터리: 20분 세션에서 발열 경고 없이 유지(ANE/NNAPI 우선, 화면 밝기 가이드)

---

## 13. 비용·수익 가정
- LLM 비용(미디엄): **$1.4/인·월**(한국어 보정 1.3× → ~$1.8) — *가성비 모델 기준*
- 최악 가정: **$5/인·월**, 고정비 **$120/월** → **BEP=24명**, 25명부터 이익.
- 가격: 프리미엄 $10/월, 무료 텍스트·제한 모드.

---

## 14. 개발 전략 & 스프린트 플랜
### 스프린트 0(2주) — 기술 스파이크
- Three.js 디오라마 미니 씬 + 캐릭터 1종
- iOS(Core ML/ANE)·Android(TFLite/NNAPI) 경량 SER PoC(3s 윈도)
- 브리지: 네이티브→WebView 요약 송신 데모, tRPC 스트림 연결 테스트

### 스프린트 1(3주) — 기본 파이프라인
- 씬 초기화(배경/포인트/오브젝트) ↔ 캐릭터 제어 분리 반영
- SER 요약→행동 매핑 테이블 v1(approach/step_back/comfort/surprise)
- 어드민: 자산 업로드, 포인트 CRUD 초안 + 미리보기

### 스프린트 2(3주) — 품질·안정화
- SER 튜닝(윈도/주기/양자화), 배터리/발열 프로파일링
- 위험 시 10–20s 압축 클립 업로드(옵트인) 경로
- 캐릭터 연출 다변화(바위 뒤 등장, 나무 뒤 숨기, 착지)
- 어드민: 사용자 로그 뷰·간단 리포트

### 스프린트 3(3주) — 커리큘럼/세이프티
- 7일 플로우(리추얼/보상/리뷰) 연결
- 안전 규칙 고도화, 전문가 연결 워크플로우
- 사내 알파 50명 운영, KPI 트래킹(세션길이/리텐션/완주율)

---

## 15. 품질보증(QA)·테스트
- 단말 매트릭스: iOS(A12~A18), Android(2020~플래그십)
- 로드/장시간 세션 테스트(20–30분), 백그라운드/복귀, 오디오 권한 케이스
- LLM 응답 가드레일(해로운 발화, 의학적 주장 회피, 안전 라우팅)

---

## 16. 모니터링·운영
- **클라**: Sentry(크래시), RN Performance, WebView JS 오류 수집
- **서버**: OpenTelemetry → Prometheus/Grafana, 로깅 Loki + 유지 30–90일
- **제품 분석**: PostHog/Segment → BigQuery/Snowflake, 대시보드 Metabase
- **알림**: PagerDuty/Slack, tRPC 오류율/지연 임계, 리스크 이벤트 전파
- **런북**: 오디오 중단/LLM 장애/토큰 폭주/스토리지 실패 대응 절차 문서화

---

## 17. 접근성·현지화
- 자막/텍스트 대안, 색각보정 팔레트, 모션 감소 옵션
- 다국어(ko/en부터), 시간·날씨 로컬라이즈, 지역별 안전기관 목록

---

## 18. 리스크 & 완화
- 웹GL 성능/권한(특히 iOS): 네이티브 브리지로 보완, 자산 최적화
- SER 오판/바이어스: 지속 벤치마킹, 휴먼 검토 루프
- 콘텐츠 공수: 모듈화·재사용, 시즌 팩 운영, 크리에이터툴 내부화
- 경쟁사 복제: 온디바이스 프라이버시, 안전 네트워크, 연출/커리큘럼 자산으로 방어

---

## 19. 팀·역할
- **PM/프로듀서**, **3D/테크 아트**, **웹 3D(Three.js)**, **모바일(RN)**, **iOS/Android 네이티브 오디오·ML**, **백엔드(tRPC/Node/DB)**, **AI 엔지니어(LLM/세이프티)**, **QA/데브옵스**, **임상/교육 자문**

---

## 20. 런칭 기준(Exit Criteria)
- Alpha: 50명, 세션 15분↑, 안전 플래그/천명당 < 5, 크래시율 < 0.5%
- Beta: 500명, 7일 리텐션 ≥ 30%, 완주율 ≥ 40%, LLM비 ≤ $5/인·월
- Launch: 파트너 파일럿 2곳+, 결제/환불 플로우, CS 프로세스 정착

---

## 21. 브랜드/네이밍 가이드 (노킹해븐스도어)
- **네임 톤**: 따뜻함·위로·신뢰. 종교/정치적 뉘앙스는 배제하고 "마음(heaven)을 노크(knocking)"하는 은유 강조.
- **로고 아이디어**
  - 육각형 디오라마 실루엣 + 작은 동물의 발자국/꼬리
  - 문 손잡이 모양의 별/빛이 육각형 가장자리를 두드리는 형태
  - 심볼: `K` + `H` + `D`를 겹친 모노그램(라운드 코너)
- **컬러 팔레트**
  - 베이스: 포레스트 그린(#2F5D50), 미드톤 세이지(#8CB8A4)
  - 포인트: 하니옐로(#FFD169), 핑크 코랄(#F3A6A0)
  - 중립: 웜그레이(#F6F4EF), 차콜(#2B2B2B)
- **타이포**
  - 한글: Pretendard/나눔스퀘어/산돌 고딕(가독성)
  - 라틴: Inter/Manrope/General Sans
- **사운드 아이덴티티**
  - 잔잔한 우드(wood) 노크 SFX + 숲 앰비언스(바람·새소리)
- **카피 톤**: "함께", "가볍게", "안전하게". 의학적 단정(X), 보조·동행 표현(O)
- **법적 점검**
  - 상표/저작권/도메인 가용성 사전 검색 권장(국내/글로벌)
- **도메인/핸들 포맷(예시)**
  - `knockingheavensdoor.app`, `knockhd.app`, `khd.app` *(가용성은 별도 확인 필요)*

---

