## 어드민/관리자 도구

### Bible Studio(정서교육)
- 유닛 편집기: 목표/스크립트/분기/루브릭/리소스 편집, 한국 테마 프리셋 적용
- 버전/스테이지 관리: dev→alpha→beta→prod 승격
- Knowledge Pack 빌드/배포: 요약/루브릭/매핑/규칙 묶음 생성
- 검수/테스트: 시뮬레이션(프리뷰 탭과 연동), A/B 경로 실험 그룹 지정

### 스택
- Next.js 15 + TypeScript + Tailwind CSS 4.1 + shadcn/ui
- R3F 프리뷰, 인증/권한(RBAC), 업로드: Cloudflare R2(Pre-signed), 감사 로그

### 포인트/자산 관리
- Asset 테이블, Point CRUD + 3D 인스펙터, 스테이지 배포

### 퀘스트/콘텐츠 스튜디오
- 노드 에디터, 루브릭 빌더, 프리뷰, A/B 실험, 검수

### AI 보조 배경 제작(1–4)
- Skybox Studio / Module Builder / Scan Import / FX Composer
- 품질/정책/비용/롤백 가드

### 모바일 패리티 프리뷰(공유 프리뷰 앱)
- 목표: 어드민에서 모바일 앱과 최대한 동일한 화면/상호작용을 미리보기
- 전략
  - UI 공유: RN 컴포넌트 설계 시, 핵심 UI/로직을 "표준 React"로 분리(RSC 불필요), `react-native-web` 호환 계층을 둠
  - 3D 공유: WebView에서 실행될 Three.js 씬을 어드민에서도 동일 URL/파라미터로 임베드(R3F 또는 바닐라 three 프리뷰)
  - 데이터 공유: tRPC 클라이언트/타입 공유 패키지로 Admin/모바일 동형 API 호출
  - 상태/플래그: Feature Flag/프리셋으로 테마/동물/씬/레시피를 강제 선택해 시나리오 재생
  - 음성 대체: 온디바이스 음성은 웹에서는 샘플 JSON(녹화 리플레이) 또는 마이크 WebAudio 데모(품질 제한)로 대체
- 결과: 어드민에서 "앱처럼 보이는" 프리뷰 탭을 제공, 실제 앱은 나중에 RN 래퍼만 씌우는 전략
