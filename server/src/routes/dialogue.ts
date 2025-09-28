import type { FastifyInstance } from 'fastify';
import { generateText } from '../llm/adapter.js';
import { z } from 'zod';

export async function registerDialogueRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/dialogue.sendUserText', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const sessionId = input.sessionId;
      const text = input.text || '';
      const userTurn = { session_id: sessionId, role: 'user', text, created_at: new Date().toISOString() };
      const insUser = await db.collection('dialogue_turns').insertOne(userTurn);
      const system = 'You are a warm Korean emotional companion. Keep responses gentle and short.';
      const aiText = await generateText({ prompt: text, system, locale: 'ko' });
      const aiTurn = { session_id: sessionId, role: 'ai', text: aiText, created_at: new Date().toISOString() };
      await db.collection('dialogue_turns').insertOne(aiTurn);
      reply.send({ turnId: insUser.insertedId.toString(), reply: { text: aiText } });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // Orchestrator: Perception -> Coach -> Director -> Safety (stubbed minimal)
  app.post('/trpc/ai.orchestrator.chat', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ sessionId: z.string().min(1), text: z.string().min(1), asUserId: z.string().optional() });
      const input = schema.parse(((req.body as any)?.input || {}));
      const userId = input.asUserId || (req as any).user?.uid || 'anon';
      const now = new Date().toISOString();
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

      // persist user turn
      const userTurnDoc = { user_id: userId, session_id: input.sessionId, role: 'user', text: input.text, created_at: now, trace_id: traceId };
      await db.collection('dialogue_turns').insertOne(userTurnDoc);
      await db.collection('ai_events').insertOne({ user_id: userId, session_id: input.sessionId, event_type: 'user_turn.saved', payload: { text: input.text }, ts: now, trace_id: traceId });
      const rtAny: any = (app as any)._realtime;
      rtAny?.broadcastAiEvent?.({ type: 'user_turn.saved', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: { text: input.text } });

      // Bridge analysis (textual)
      const bridgeSystem = '당신은 감정 동반자 시스템의 브릿지(Perception/Coach) 설명자입니다. 한국어로 간결히 기술하세요.';
      const bridgeAnalysisText = await generateText({
        prompt: `사용자 발화:
"${input.text}"
위 발화를 바탕으로 감정/의도/맥락을 2-3문장으로 요약하고, 관찰된 단서(어휘, 어조)를 짧게 나열하세요.`,
        system: bridgeSystem,
        locale: 'ko'
      });
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'bridge.analysis',
        payload: { text: bridgeAnalysisText },
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'bridge', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'bridge.analysis', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: { text: bridgeAnalysisText } });

      // Perception → 실제 라우트 호출
      const perResp = await (app as any).inject({
        method: 'POST', url: '/trpc/ai.perception.summarize',
        payload: { input: { signals: { ser_label: 'neutral' }, text: input.text } },
      });
      const perJson = perResp?.json?.() || {};
      const state = perJson?.state || { need: 'calm', level: 1, risk: 0 };
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'perception.output', payload: state,
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'perception', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'perception.output', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: state });

      // Director → 실제 라우트 호출
      const dirResp = await (app as any).inject({ method: 'POST', url: '/trpc/ai.director.decideActions', payload: { input: { state } } });
      const intent = dirResp?.json?.() || { intent: 'approach_slow', expr: 'neutral', anim: 'Walk', ts: now };
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'director.intent', payload: intent,
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'director', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'director.intent', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: intent });

      // Master review (textual oversight)
      const masterSystem = '당신은 마스터 AI입니다. 브릿지 분석과 디렉터 인텐트를 검토하여 승인/조정 사유를 간결히 서술하세요.';
      const masterReviewText = await generateText({
        prompt: `브릿지 분석:\n${bridgeAnalysisText}\n\nPerception 상태:${JSON.stringify(state)}\nDirector 인텐트:${JSON.stringify(intent)}\n위 흐름이 적절한지 2-3문장으로 검토하고, 필요시 조정 제안 1가지를 권고하세요.`,
        system: masterSystem,
        locale: 'ko'
      });
      const masterDecision = 'approve';
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'master.review',
        payload: { notes: masterReviewText, decision: masterDecision },
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'master', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'master.review', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: { notes: masterReviewText, decision: masterDecision } });

      // AI reply → 실제 라우트 호출
      const llmResp = await (app as any).inject({
        method: 'POST', url: '/trpc/ai.reply.generate',
        payload: { input: { text: input.text, locale: 'ko' } },
      });
      const llmJson = llmResp?.json?.() || {};
      const aiText = llmJson?.text || '...';
      const nextQuestion = await generateText({
        prompt: `사용자: "${input.text}"\nAI가 공감적 대화를 이어가기 위한 다음 질문을 한국어로 1문장 제안하세요.`,
        system: '공감적이고 부드럽게, 닫힌질문이 아닌 열린질문을 권장합니다.',
        locale: 'ko'
      });
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'llm.reply', payload: { text: aiText, next_question: nextQuestion },
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'llm', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'llm.reply', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: { text: aiText, next_question: nextQuestion } });

      // persist ai turn
      await db.collection('dialogue_turns').insertOne({ user_id: userId, session_id: input.sessionId, role: 'ai', text: aiText, intent, created_at: now, trace_id: traceId });

      // naive rolling session summary upsert
      const sumRes = await db.collection('session_summaries').updateOne(
        { user_id: userId, session_id: input.sessionId },
        { $set: { user_id: userId, session_id: input.sessionId, updated_at: now }, $setOnInsert: { created_at: now } },
        { upsert: true }
      );
      await db.collection('ai_events').insertOne({
        user_id: userId, session_id: input.sessionId, event_type: 'summary.upserted', payload: { updated_at: now, upserted: sumRes?.upsertedId },
        provider: process.env.LLM_PROVIDER || 'gemini', model: process.env.GEMINI_MODEL || null,
        pack_version: process.env.PACK_VERSION || null, autopilot_phase: 'summary', ts: now, trace_id: traceId,
      });
      rtAny?.broadcastAiEvent?.({ type: 'summary.upserted', user_id: userId, session_id: input.sessionId, ts: now, trace_id: traceId, payload: { updated_at: now } });

      // broadcast intent
      const rt: any = (app as any)._realtime;
      rt?.broadcastDialogueIntent?.({ user_id: userId, session_id: input.sessionId, intent, ts: now, trace_id: traceId });

      reply.send({ text: aiText, intent, state, traceId });
    } catch (e: any) {
      if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues });
      reply.code(500).send({ error: e?.message || 'error' });
    }
  });

  app.get('/trpc/dialogue.turns.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const q = (req.query as any) || {};
      const sessionId = q.sessionId;
      if (!sessionId) return reply.code(400).send({ error: 'sessionId_required' });
      const limit = Math.min(Number(q.limit || 100), 300);
      const items = await db.collection('dialogue_turns')
        .find({ session_id: sessionId })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
      reply.send({ items: items.reverse() });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


