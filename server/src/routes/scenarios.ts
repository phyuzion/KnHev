import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerScenarioRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  app.post('/trpc/scenarios.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        domain: z.enum(['assessment','intervention']),
        tags: z.array(z.string()).optional(),
        version: z.string().default('v1'),
        inputs: z.record(z.string(), z.any()).optional(),
        steps: z.array(z.record(z.string(), z.any())).default([]),
        scoring: z.record(z.string(), z.any()).optional(),
        meta: z.record(z.string(), z.any()).optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc = {
        title: input.title,
        domain: input.domain,
        tags: input.tags || [],
        version: input.version,
        inputs: input.inputs || {},
        steps: input.steps || [],
        scoring: input.scoring || {},
        meta: input.meta || {},
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('scenarios').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/scenarios.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('scenarios').find({}).sort({ _id: -1 }).limit(100).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/scenario.results.log', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        scenario_id: z.string().min(1),
        scores: z.record(z.string(), z.number()).default({}),
        risk_flags: z.array(z.string()).default([]),
        raw: z.record(z.string(), z.any()).optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: (req as any).user?.uid || 'anon',
        scenario_id: input.scenario_id,
        scores: input.scores,
        risk_flags: input.risk_flags,
        raw: input.raw || {},
        ts: new Date().toISOString(),
      };
      const r = await db.collection('scenario_results').insertOne(doc);
      reply.send({ _id: r.insertedId.toString() });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


