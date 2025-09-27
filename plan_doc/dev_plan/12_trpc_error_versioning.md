## 에러/버전/표준 규약

### 에러 분류
- `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`

### 응답 규격
- 성공: 도메인 오브젝트/리스트 (커서 페이징 `{ items, nextCursor? }`)
- 실패: `{ error: { code, message }, reqId }` (HTTP는 200, tRPC 표준 따름)

### 버전
- 라우터 네임스페이스 `v1` 유지(브레이킹 시 `v2` 병행)
- 클라이언트는 `X-Client-Version` 헤더 제공(진단용)

### 페이징
- 입력: `{ limit?: number(<=100), cursor?: string }`
- 출력: `{ items: T[], nextCursor?: string }`

### 크기 제한
- 입력/출력 바이트 제한 256KB(기본). 대용량은 R2 presigned URL 사용

### 레이트리밋(권장)
- IP/유저 기준 RPM 제한, 위험 엔드포인트 강화
