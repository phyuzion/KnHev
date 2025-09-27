import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerCurriculumRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  app.post('/trpc/curriculum.units.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        taxonomy: z.record(z.string(), z.any()).optional(),
        activities: z.array(z.record(z.string(), z.any())).default([]),
        rubric_refs: z.array(z.string()).default([]),
        version: z.string().default('v1'),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc = {
        title: input.title,
        taxonomy: input.taxonomy || {},
        activities: input.activities || [],
        rubric_refs: input.rubric_refs || [],
        version: input.version,
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('curriculum_units').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/curriculum.units.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('curriculum_units').find({}).sort({ _id: -1 }).limit(100).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/curriculum.plans.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        horizon_weeks: z.number().min(1).max(8).default(2),
        items: z.array(z.object({ day: z.number().min(1), type: z.enum(['activity','scenario']), ref: z.string(), notes: z.string().optional() })).default([])
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: (req as any).user?.uid || 'anon',
        horizon_weeks: input.horizon_weeks,
        items: input.items,
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('curriculum_plans').insertOne({ ...doc, created_at: new Date().toISOString() });
      reply.send({ _id: r.insertedId.toString(), ...doc });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/curriculum.assignments.log', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        plan_id: z.string().min(1),
        day: z.number().min(1),
        type: z.enum(['activity','scenario']),
        ref: z.string().min(1),
        status: z.enum(['pending','done','skipped']).default('done'),
        feedback: z.string().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const doc = {
        user_id: (req as any).user?.uid || 'anon',
        plan_id: input.plan_id,
        day: input.day,
        type: input.type,
        ref: input.ref,
        status: input.status,
        feedback: input.feedback || null,
        ts: new Date().toISOString(),
      };
      const r = await db.collection('curriculum_assignments').insertOne(doc);
      reply.send({ _id: r.insertedId.toString() });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


