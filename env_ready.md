# 환경 준비 체크리스트

## 공통
- [ ] MongoDB Atlas `MONGODB_URI` 확정/공유
- [ ] Firebase(Web/RN) 키 세트 발급/공유

## server/.env.development (로컬)
- [ ] TRPC_HTTP_URL=http://localhost:8787/trpc
- [ ] TRPC_WS_URL=ws://localhost:8787/trpc
- [ ] MONGODB_URI=...
- [ ] JWT_SECRET=...
- [ ] LLM_PROVIDER/LLM_API_KEY (모킹 가능)

## client/.env.development (로컬)
- [ ] EXPO_PUBLIC_TRPC_HTTP_URL=http://localhost:8787/trpc
- [ ] EXPO_PUBLIC_TRPC_WS_URL=ws://localhost:8787/trpc
- [ ] EXPO_PUBLIC_FIREBASE_* 채움

## admin/.env.development (로컬)
- [ ] NEXT_PUBLIC_TRPC_HTTP_URL=http://localhost:8787/trpc
- [ ] NEXT_PUBLIC_CDN_BASE_URL=http://localhost:3000
- [ ] NEXT_PUBLIC_FIREBASE_* 채움
- [ ] ADMIN_SESSION_SECRET=...
- [ ] MONGODB_URI=...

## 배포(Render 준비 시)
- [ ] 서버용 server/.env 값 확정(프로덕션)
- [ ] Admin `NEXT_PUBLIC_*` 프로덕션 엔드포인트
- [ ] (도메인/Cloudflare/R2) 프리-릴리즈 단계에서 진행
