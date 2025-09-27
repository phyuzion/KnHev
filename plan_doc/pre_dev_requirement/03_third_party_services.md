## 외부 서비스/SDK 목록 및 비교

### 인프라
- 스토리지: Cloudflare R2(S3 호환)
- CDN: Cloudflare(정적 에셋 캐시)  
  ※ 도메인 구매/네임서버/SSL 세팅은 프리-릴리즈 단계에서 수행(릴리즈 체크리스트 참조)
- DB: MongoDB Atlas
- 호스팅: Render/Fly.io(초기 로컬 우선, 배포는 후속)

### 인증/권한/분석(Pre-Dev 핵심)
- Firebase Authentication: Google(웹/Android/iOS), Apple(iOS)
- Firebase Analytics, Crashlytics: 모바일/웹 공통 계측/크래시
- (선택) Firebase Remote Config/Feature Flags

### 모니터링/분석(정렬)
- 클라이언트: Firebase Analytics/Crashlytics 우선
- 서버: Otel→Prom/Grafana(옵션, 로컬 단계는 로그 중심)

### LLM/AI
- 가성비 한국어 모델(후속), 지금은 로컬 모킹/샘플 데이터로 진행

### 체크리스트(Pre-Dev)
- [ ] Firebase 프로젝트 생성, Web+iOS+Android 앱 추가
- [ ] Auth 프로바이더 활성화(Google, Sign in with Apple(iOS))
- [ ] Android SHA-1/256 등록, iOS 번들/Capabilities(Apple Sign In)
- [ ] Analytics/Crashlytics 활성화, SDK 연동 계획 수립
- [ ] MongoDB Atlas 프로젝트/네트워크 액세스/사용자 생성
- [ ] (도메인/SSL/Cloudflare 레코드) → 프리-릴리즈로 이동
