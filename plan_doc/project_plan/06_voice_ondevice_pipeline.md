## 온디바이스 음성 파이프라인

### 체인
16kHz Mono → VAD → 노이즈 억제 → 특징(MFCC32 Δ/ΔΔ, F0, Energy, speech rate) → SER(1–3M, INT8) → 3–5s 요약

### 플랫폼
- iOS: AVAudioEngine + Core ML(ANE 우선)
- Android: Oboe/AAudio + TFLite(NNAPI/GPU Delegate)

### 윈도/스무딩
- EMA 스무딩, 히스테리시스, 임계치 조정

### 출력 패킷
`{ts, pitch_mean/var, energy_mean/var, mfcc32_stats, speech_rate, vad_ratio, ser_label, ser_conf, risk_score}`

### 폴백/배터리
- Delegate 우선순위: ANE/NPU > GPU > CPU
- 저전력 모드: 윈도↑, 업데이트 주기↓

### 품질 관리
- 내부/공개 코퍼스 벤치, 편향 점검, 휴먼 검토 루프
