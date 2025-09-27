# 스토리지(R2)

## presign 플로우
- 인증 가드 → key/contentType 수신 → S3 서명 URL 생성 → public URL 반환
- ENV: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID/SECRET, R2_BUCKET(or R2_S3_API), R2_PUBLIC_DEV_URL/R2_CUSTOM_DOMAIN

## 선택 사유
- 대용량 에셋 비용/egress/CDN/커스텀 도메인 유리, S3 호환성

## 보완
- 만료 후 접근 거절, 사이즈/Content-MD5 제한, 바이러스 스캔(옵션), 폴더 정책
