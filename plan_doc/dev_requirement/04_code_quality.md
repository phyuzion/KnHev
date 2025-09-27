## 코드 품질 기준

- 포매팅: Prettier, EditorConfig
- 린트: ESLint(typescript-eslint), 규칙 베이스라인 정의
- 타입: TypeScript strict, any 금지(불가피 시 최소 범위)
- 테스트: 유닛/컴포넌트/통합, 커버리지 목표(초기 60%+)
- CI: 설치→빌드→린트→타입→테스트 파이프라인
