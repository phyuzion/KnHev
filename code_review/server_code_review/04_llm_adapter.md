# LLM 어댑터/프롬프트 정책

## 어댑터
- `server/src/llm/adapter.ts`에서 `LLM_PROVIDER`로 분기(Gemini 기본)
- Gemini 2.0 Flash: system_instruction 활용, 한/영 locale 지원

## 프롬프트
- Companion: 따뜻하고 짧은 코리안 톤, Safety 회피 지시
- 회피 리스트(키워드) 시스템 프롬프트로 전달

## 확장
- OpenAI/Llama 어댑터 추가 용이
- MCP 도입 시 도구 호출 인터페이스 통일
