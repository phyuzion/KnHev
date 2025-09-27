## 벤더 계정/권한 매트릭스

- Firebase: Owner(디렉터), Editor(PM/개발), 최소 권한 원칙(프로젝트/앱 단위)
- MongoDB Atlas: Project Owner(디렉터), DB User(읽기/쓰기 분리 가능)
- Cloudflare: 계정/Zone 생성은 프리-릴리즈 단계(도메인 구매/네임서버)
- Render/Fly.io: 배포 전 계정 준비(로컬 단계에선 선택)
- 모니터링: Firebase Analytics/Crashlytics 우선, Grafana 등은 후순위

체크리스트
- [ ] Firebase 프로젝트/앱(Web, iOS, Android) 생성 및 권한
- [ ] MongoDB Atlas 프로젝트/네트워크 및 사용자
- [ ] (Cloudflare/도메인) 프리-릴리즈에서 진행
- [ ] 키 보관/시크릿 매니저 정책
