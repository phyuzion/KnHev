import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerSummariesRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/summaries.session.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        session_id: z.string(),
        ts: z.string().optional(),
        summary_text: z.string().min(1),
        topics: z.array(z.string()).optional(),
        key_points: z.array(z.string()).optional(),
        mood_delta: z.number().nullable().optional(),
        sel_delta: z.number().nullable().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: input.userId || (req as any).user?.uid || 'anon',
        session_id: input.session_id,
        ts: input.ts || new Date().toISOString(),
        summary_text: input.summary_text,
        topics: input.topics,
        key_points: input.key_points,
        mood_delta: input.mood_delta,
        sel_delta: input.sel_delta,
      };
      await db.collection('session_summaries').insertOne(doc);
      reply.send({ ok: true });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/summaries.session.get', async (req, reply) => {
    try {
      const db: any = (app as any).mongo?.db;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const q = (req.query as any) || {};
      const sessionId = q.sessionId;
      if (!sessionId) return reply.code(400).send({ error: 'sessionId_required' });
      const doc = await db.collection('session_summaries').findOne({ session_id: sessionId });
      if (!doc) return reply.send(null);
      reply.send({ _id: doc._id.toString(), session_id: doc.session_id, ts: doc.ts, summary_text: doc.summary_text, topics: doc.topics || [], key_points: doc.key_points || [] });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/summaries.daily.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        date: z.string().min(4),
        summary_text: z.string().min(1),
        mood_delta: z.number().nullable().optional(),
        sel_delta: z.number().nullable().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const filter: any = { user_id: input.userId || (req as any).user?.uid || 'anon', date: input.date };
      const doc: any = {
        summary_text: input.summary_text,
        mood_delta: input.mood_delta,
        sel_delta: input.sel_delta,
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('daily_summaries').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      reply.send(r.value ? { ...r.value, _id: r.value._id.toString() } : null);
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/history.search', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ q: z.string().min(1), userId: z.string().optional() });
      const { q, userId } = schema.parse((req.query as any) || {});
      if (!q) return reply.code(400).send({ error: 'q_required' });
      const filter: any = { summary_text: { $regex: q, $options: 'i' } };
      if (userId) filter.user_id = userId;
      const items = await db.collection('session_summaries').find(filter).sort({ _id: -1 }).limit(20).toArray();
      reply.send({ items: items.map((d: any) => ({ _id: d._id.toString(), session_id: d.session_id, ts: d.ts, summary_text: d.summary_text, topics: d.topics || [] })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


