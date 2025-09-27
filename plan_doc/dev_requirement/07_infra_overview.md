## 인프라 개요

- 런타임: Node.js 20 + Fastify + tRPC
- 데이터: MongoDB Atlas(Managed), Redis(선택), Cloudflare R2(S3 호환)
- 네트워크: WebSocket(tRPC), CDN: Cloudflare
- 관측성: OpenTelemetry → Prom/Grafana, 로그 Loki
- 웹 빌드: Vite 6
- 어드민: Next.js 15 + TS + Tailwind 4.1
- 호스팅: 시작은 Render/Fly.io, 정적은 Cloudflare CDN
