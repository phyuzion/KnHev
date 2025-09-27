## 정렬 상태표(Alignment Status) — 2025-09-26

### 범위
- `project_plan/01~30`, `dev_plan/10,11`, 핵심 `pre_dev_requirement`, `dev_requirement` 요약 상태
- 기준: 스택(Next15/TS, Vite6, Tailwind 4.1, Node20/Fastify/tRPC, MongoDB Atlas, Cloudflare R2/CDN, Firebase), AI 멀티에이전트(MCP), 로깅/관측성, 데이터 모델(뉴런형), 환경/BGM 택소노미(need/regulation)

### Project Plan 정렬 현황
- `01_product_vision.md`: Updated — 펫-컴패니언 철학/AI 교육 철학 반영
- `02_ux_journey.md`: Updated — 자연 대화/동적 반응/학습 흐름 정렬
- `03_architecture_overview.md`: Updated — Mongo/R2/CDN, LLM 어댑터, MCP 명시
- `04_3d_scene_design.md`: Updated — `scene_configs` Mongo, 포인트 편집/프리뷰
- `05_character_behavior_mapping.md`: Updated — Director/액션 매핑 정렬
- `06_voice_ondevice_pipeline.md`: OK — SER 3–5s 요약, iOS/Android 체인 일치
- `07_backend_intent_mapping.md`: Updated — tRPC/WS, Mongo/R2, 멀티에이전트
- `08_content_engine.md`: OK — 정책/레시피 개념 최신 설계와 합치
- `09_admin_tools.md`: Updated — Next15/TW4.1, R2 업로드, Mobile Parity
- `10_data_model.md`: Updated — 뉴런형 그래프 컬렉션 확장/인덱스
- `11_security_privacy_safety.md`: Updated — 데이터 보존/R2, MCP 세이프티
- `12_performance_goals.md`: OK — 성능 목표 최신 스택 기준으로 해석 일치
- `13_costs_revenue.md`: OK — 비용 항목/모델 반영 가능
- `14_roadmap_sprints.md`: OK — 스프린트/마일스톤 일치
- `15_qaqc_testing.md`: OK — QA/AC/테스트 프레임 일치
- `16_monitoring_ops.md`: OK — 모니터링/운영 개요 일치(세부는 dev_plan 11 참조)
- `17_accessibility_localization.md`: OK — 자막/색각/모션/다국어
- `18_risks_mitigations.md`: OK — SER 바이어스/자산/복제 대응
- `19_team_roles.md`: OK — 롤/전문성 범위 일치
- `20_launch_criteria.md`: OK — Alpha/Beta/Launch 기준 합리적
- `21_brand_naming.md`: OK — 톤/도메인 참고
- `22_governance_operating_model.md`: OK — RACI/리듬/템플릿
- `23_memory_graph_design.md`: OK — 이벤트 우선/요약 파생, 쿼리 경로 일치
- `24_environment_bgm_engine.md`: Updated — need/regulation 택소노미/API 정렬
- `25_ai_system_design.md`: OK — MAGI/Autopilot/어댑터/MCP 일치
- `26_sel_bible.md`: OK — 루브릭/버전/핀 전략 일치
- `27_ai_grounding_knowledge_packs.md`: OK — 얇은 그라운딩/버전 핀
- `28_coaching_skeleton_seed.md`: OK — BASE_SKEL_V1 구조/운용 일치
- `29_system_summary.md`: Updated — 환경·BGM 택소노미 포함
- `30_mcp_architecture.md`: OK — MCP 툴/보안/로깅/이행 경로 일치

### Dev Plan 정렬 현황
- `dev_plan/10_trpc_api_spec.md`: Updated — env/bgm need·regulation, 타입/잡명 정리
- `dev_plan/11_trpc_logging_observability.md`: Updated — provider/model/pack_version 일괄 포함

### Pre-Dev / Dev Requirement 요약
- `pre_dev_requirement/03_third_party_services.md`: OK — Firebase/Auth/Analytics, MongoDB Atlas, Cloudflare R2/CDN 명시
- `dev_requirement/01_env_vars.md`: OK — `MCP_AUTH_TOKEN`, Mongo URI 포함

### 오픈 이슈/후속 조치
- 서버 스캐폴딩(`server_scaffold`): in_progress — Fastify+tRPC+Mongo 연결/헬스/라우터 착수 필요
- 문서 인덱스 링크 갱신: 필요 시 `00_index.md`에 `31_alignment_status.md` 추가

### 변경 로그(이번 패스)
- 24, 29: 환경/BGM need·regulation 택소노미 정렬
- 10(Dev), 11(Dev): API/로깅 필드 정합성 보정
