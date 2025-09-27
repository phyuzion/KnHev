# Seeds Index

- skeletons/BASE_SKEL_V1.json — 코칭 베이스 스켈레톤(확장 원형)
- skeletons/EMPATHY_L1_V1.json — 공감 레벨1 파생 스켈레톤
- skeletons/BOUNDARY_L1_V1.json — 경계 설정 레벨1 파생 스켈레톤
- skeletons/HELP_SEEK_L1_V1.json — 도움 요청 레벨1 파생 스켈레톤
- rubrics/SEL_RUBRIC_V1.json — SEL 루브릭(자동 평가 기준)
- policies/style_guide_ko_v1.json — 톤/길이/금기 스타일 가이드(한국어)
- policies/safety_rules_v1.json — 안전/금칙 규칙
- mapping/action_mapping_v1.json — 감정→의도→연출 파라미터 매핑(요약)
- knowledge_packs/KNOWLEDGE_PACK_TEMPLATE_V1.json — 경량 그라운딩 패키지 템플릿
- env/env_presets_basic_v1.json — 시간대/날씨 프리셋(요약)
- bgm/tracks_classical_seed_v1.json — 클래식 트랙 시드(메타만)

로딩 가이드
- 최초 로딩: admin 콘솔/스크립트로 JSON을 MongoDB 컬렉션에 upsert
- 컬렉션 매핑: skeletons→`coaching_skeletons`, rubrics→`sel_evaluations` 참고, policies/mapping→pack 빌드 재료
