## 3D 씬 설계

### 계층 구조
- 배경: 디오라마 GLB, 라이트/스카이박스, 지면 콜리전
- 캐릭터: 종별 GLB(본/애니/블렌드셰이프)
- 날씨: GPU 파티클/포그/라이트 세트
- 보조 오브젝트: 공/열매/막대기(물리)

### 포인트 시스템
스키마: `{ name, type(appear|seat|fly|land|hide|pathNode), position:[x,y,z], rotation?, radius?, meta{…} }`
- 저장: MongoDB `scene_configs` 컬렉션(버전 필드)
- 프리뷰: Admin WebGL(R3F)

### 경로·이동
- NavMesh→Path Graph 변환 또는 yuka
- Raycaster로 Y보정, 단순 콜리전

### 에셋 파이프라인
- Blender→glTF/GLB, gltfpack+Draco+KTX2
- 텍스처: PNG→KTX2, 검증: glTF Validator

### 사계절·프리셋
- 봄/벚꽃, 여름/장마, 가을/억새, 겨울/첫눈

### 성능 지침
- 폴리/머티리얼 한계, LOD, 인스턴싱, lazy-load, 모바일 FPS 타깃
