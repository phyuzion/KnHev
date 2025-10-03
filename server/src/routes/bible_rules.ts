import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerBibleRulesRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  // indexes (idempotent)
  try {
    await db.collection('bible_rules').createIndex({ status: 1, category: 1, updated_at: -1 });
    await db.collection('bible_rule_changes').createIndex({ rule_id: 1, created_at: -1 });
    await db.collection('bible_rules').createIndex({ rule_text: 'text' });
  } catch {}

  // list/search
  app.get('/trpc/bible.rules.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const q = (req.query as any) || {};
      const filter: any = {};
      if (q.status) filter.status = q.status;
      if (q.category) filter.category = q.category;
      if (q.source) filter.source = q.source;
      if (q.q) filter.$text = { $search: String(q.q) };
      const limit = Math.min(Number(q.limit || 50), 200);
      const items = await db.collection('bible_rules').find(filter).sort({ updated_at: -1 }).limit(limit).toArray();
      reply.send({ items: items.map((d:any)=>({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // changes list
  app.get('/trpc/bible.rules.changes.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const q = (req.query as any) || {};
      const limit = Math.min(Number(q.limit || 100), 300);
      const filter: any = {};
      if (q.ruleId) filter.rule_id = new ObjectId(String(q.ruleId));
      const items = await db.collection('bible_rule_changes')
        .find(filter)
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
      reply.send({ items: items.map((d:any)=>({ ...d, _id: d._id?.toString?.() })) });
    } catch (e:any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // upsert
  app.post('/trpc/bible.rules.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAdmin(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        _id: z.string().optional(),
        rule_text: z.string().min(4),
        category: z.string().optional(),
        status: z.enum(['active','draft','archived']).optional(),
        source: z.enum(['seed','manual','from_user']).optional(),
        tags: z.array(z.string()).optional(),
        version: z.string().optional(),
        provenance: z.any().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const now = new Date().toISOString();
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc: any = {
        rule_text: input.rule_text,
        category: input.category || 'ethics',
        status: input.status || 'active',
        source: input.source || 'manual',
        tags: input.tags || [],
        version: input.version || 'v1',
        provenance: input.provenance || {},
        updated_at: now,
      };
      const r = await db.collection('bible_rules').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: now, author: (req as any).user?.uid || 'admin' } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const saved = r.value && { ...r.value, _id: r.value._id.toString() };
      if (saved) {
        await db.collection('bible_rule_changes').insertOne({ rule_id: saved._id, change_type: input._id ? 'update' : 'create', by: (req as any).user?.uid || 'admin', diff: doc, trace_id: traceId, created_at: now });
        const rtAny: any = (app as any)._realtime;
        rtAny?.broadcastAiEvent?.({ type: 'master.rule_upserted', trace_id: traceId, payload: { rule_id: saved._id, status: saved.status }, ts: now });
      }
      reply.send(saved);
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // archive
  app.post('/trpc/bible.rules.archive', async (req, reply) => {
    try {
      if (!(app as any).ensureAdmin(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const id = (req.body as any)?.input?.id as string;
      if (!id) return reply.code(400).send({ error: 'id_required' });
      const now = new Date().toISOString();
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const r = await db.collection('bible_rules').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'archived', updated_at: now } },
        { returnDocument: 'after' as const }
      );
      if (r.value) {
        await db.collection('bible_rule_changes').insertOne({ rule_id: id, change_type: 'archive', by: (req as any).user?.uid || 'admin', trace_id: traceId, created_at: now });
        const rtAny: any = (app as any)._realtime;
        rtAny?.broadcastAiEvent?.({ type: 'master.rule_archived', trace_id: traceId, payload: { rule_id: String(r.value._id), status: 'archived' }, ts: now });
      }
      reply.send(r.value ? { ...r.value, _id: r.value._id.toString() } : null);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // promote (draft -> active)
  app.post('/trpc/bible.rules.promote', async (req, reply) => {
    try {
      if (!(app as any).ensureAdmin(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ ruleId: z.string().min(1), notes: z.string().optional() });
      const input = schema.parse(((req.body as any)?.input || {}));
      const ruleId = new ObjectId(input.ruleId);
      const now = new Date().toISOString();
      const r = await db.collection('bible_rules').findOneAndUpdate(
        { _id: ruleId },
        { $set: { status: 'active', updated_at: now } },
        { returnDocument: 'after' as const }
      );
      if (!r.value) return reply.code(404).send({ error: 'not_found' });
      await db.collection('bible_rule_changes').insertOne({
        rule_id: r.value._id,
        change_type: 'promote',
        by: (req as any).user?.uid || 'admin',
        notes: input.notes || null,
        created_at: now,
      });
      const rtAny: any = (app as any)._realtime;
      rtAny?.broadcastAiEvent?.({ type: 'master.rule_promoted', payload: { rule_id: String(r.value._id), status: 'active' }, ts: now });
      reply.send({ ok: true, rule: { ...r.value, _id: String(r.value._id) } });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // propose rule from dialogue (consolidated from rules_master)
  app.post('/trpc/bible.rules.proposeFromDialogue', async (req, reply) => {
    try {
      if (!(app as any).ensureAdmin(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ sessionId: z.string().optional(), userId: z.string().optional(), limit: z.number().optional() });
      const input = schema.parse(((req.body as any)?.input || {}));
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const q: any = {};
      if (input.sessionId) q.session_id = input.sessionId;
      if (input.userId) q.user_id = input.userId;
      const turns = await db.collection('dialogue_turns').find(q).sort({ created_at: -1 }).limit(input.limit || 50).toArray();
      // safety-first guarded proposal text
      const ruleText = [
        '안전-우선 공감 규칙:',
        '1) 자/타해, 불법/범죄, 증오/차별, 극단적 위험 신호에는 공감을 적용하지 않는다.',
        '   - 즉시 안전 절차(평정, 위험도 평가, 전문가/보호자/기관 안내)를 우선한다.',
        '2) 그 외 일상적 고충에는 먼저 간단한 공감 표현 후, 열린 질문으로 원인을 탐색한다.'
      ].join(' ');
      const proposal = {
        rule_text: ruleText,
        category: 'tone',
        status: 'draft',
        source: 'from_user',
        tags: ['safety_first','empathy','open_question'],
        provenance: { session_id: input.sessionId || null, sample_turns: Math.min(turns.length, 10), summary_hint: 'guarded_by_safety_rules' },
        constraints: {
          disallow: ['self-harm','harm-to-others','illegal','hate','extremism'],
          action_on_disallow: 'deescalate_and_route_to_safety_protocols'
        },
        created_at: new Date().toISOString(),
      };
      await db.collection('bible_rule_changes').insertOne({ rule_id: null, change_type: 'proposal', by: (req as any).user?.uid || 'admin', proposal, trace_id: traceId, created_at: new Date().toISOString() });
      const rtAny: any = (app as any)._realtime;
      rtAny?.broadcastAiEvent?.({ type: 'master.rule_proposal', user_id: input.userId || (req as any).user?.uid || null, session_id: input.sessionId || null, trace_id: traceId, payload: proposal, ts: new Date().toISOString() });
      reply.send({ ok: true, proposal, traceId });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // (removed) Back-compat ai.master.* endpoints to avoid route duplication with routes/ai.ts
}


