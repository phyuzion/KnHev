import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerObservationRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/ai.events.log', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        session_id: z.string().nullable().optional(),
        type: z.string().min(1),
        payload: z.record(z.string(), z.any()).optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        ts: z.string().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: input.userId || (req as any).user?.uid || 'anon',
        session_id: input.session_id || null,
        type: input.type,
        payload: input.payload || {},
        provider: input.provider || process.env.LLM_PROVIDER || 'gemini',
        model: input.model || process.env.GEMINI_MODEL || null,
        ts: input.ts || new Date().toISOString(),
      };
      const r = await db.collection('ai_events').insertOne(doc);
      reply.send({ _id: r.insertedId.toString() });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/sel.evaluations.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        session_id: z.string().nullable().optional(),
        ts: z.string().optional(),
        scores: z.record(z.string(), z.number()).default({}),
        rubric_version: z.string().default('v1'),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: input.userId || (req as any).user?.uid || 'anon',
        session_id: input.session_id || null,
        ts: input.ts || new Date().toISOString(),
        scores: input.scores || {},
        rubric_version: input.rubric_version || 'v1',
      };
      const r = await db.collection('sel_evaluations').insertOne(doc);
      reply.send({ _id: r.insertedId.toString() });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // ai.events list with basic filters and pagination
  app.get('/trpc/ai.events.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ userId: z.string().optional(), type: z.string().optional(), from: z.string().optional(), to: z.string().optional(), limit: z.string().optional(), before: z.string().optional() });
      const q = schema.parse((req.query as any) || {});
      const filter: any = {};
      if (q.userId) filter.user_id = q.userId;
      if (q.type) filter.type = q.type;
      if (q.from || q.to) {
        filter.ts = {};
        if (q.from) filter.ts.$gte = q.from;
        if (q.to) filter.ts.$lte = q.to;
      }
      const limit = Math.min(parseInt(q.limit || '50', 10) || 50, 200);
      const cursorFilter = { ...filter };
      if (q.before) {
        const { ObjectId } = await import('mongodb');
        cursorFilter._id = { $lt: new ObjectId(q.before) };
      }
      const items = await db.collection('ai_events').find(cursorFilter).sort({ _id: -1 }).limit(limit).toArray();
      const mapped = items.map((d: any) => ({ ...d, _id: d._id.toString() }));
      const next = mapped.length === limit ? mapped[mapped.length - 1]._id : null;
      reply.send({ items: mapped, next });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


