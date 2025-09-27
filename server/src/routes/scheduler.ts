import type { FastifyInstance } from 'fastify';
import type { Realtime } from '../realtime.js';
import { z } from 'zod';

export async function registerSchedulerRoutes(app: FastifyInstance, rt: Realtime) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/scheduler.jobs.enqueue', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ type: z.string().min(1), payload: z.record(z.string(), z.any()).optional() });
      const input = schema.parse(((req.body as any)?.input || {}));
      const job = {
        type: input?.type || 'autopilot_eval',
        payload: input?.payload || {},
        status: 'queued',
        created_at: new Date().toISOString(),
      };
      const r = await db.collection('scheduler_tasks').insertOne(job);
      const out = { jobId: r.insertedId.toString(), ...job };
      rt.broadcastSchedulerJob({ type: 'enqueued', job: out });
      reply.send(out);
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/scheduler.jobs.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('scheduler_tasks').find({}).sort({ _id: -1 }).limit(50).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


