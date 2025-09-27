## CI/CD

### 파이프라인
1) Install(캐시) → 2) Lint/Type/Test → 3) Build → 4) Preview Deploy → 5) Promote

### 대상
- 서버: 컨테이너 이미지/서버리스 선택, DB 마이그레이션 순서 준수
- 클라이언트: EAS/fastlane(추후), 내부 배포 채널
- 어드민: Vercel/Netlify/Static CDN

### 가드
- 마이그레이션 롤백/백업, 피처 플래그, 헬스체크 게이팅
