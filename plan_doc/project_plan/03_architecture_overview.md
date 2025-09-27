## 기술 아키텍처 요약

### 클라이언트
- React Native 앱 셸 + WebView(Three.js)
- 온디바이스 음성: iOS(Core ML/ANE), Android(TFLite/NNAPI)
- 상태관리: Zustand/Redux Toolkit, 푸시/APNs+FCM, 로깅 Sentry

### 웹 3D
- Three.js(WebGL2), GLTF+KTX2/Draco, yuka, postprocessing
- 빌드: Vite 6

### 실시간/서버
- Node.js 20 + Fastify + tRPC v10(WS)
- DB: MongoDB Atlas, 스토리지: Cloudflare R2, CDN: Cloudflare
- LLM 어댑터: OpenAI/Gemini→Llama(self-host), MCP 내부 오케스트레이션
- 모니터링: Otel + Prom/Grafana + Loki

### 데이터 플로우(핵심)
- 클라→서버: audio stats(3–5s)
- 서버→클라: intent stream

### 배포/호스팅
- 시작: Render/Fly.io, 확장: 컨테이너/K8s
- 정적: Cloudflare CDN
