import type { FastifyInstance } from 'fastify';

export async function registerSessionRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  app.get('/trpc/users.getMe', async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ error: 'unauthenticated' });
    reply.send({ _id: user.uid, email: user.email, locale: 'ko', created_at: new Date().toISOString() });
  });

  app.post('/trpc/sessions.create', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const doc = { user_id: input.userId || (req as any).user?.uid || 'anon', device_info: input.device_info || null, t_start: new Date().toISOString() };
      const r = await db.collection('sessions').insertOne(doc);
      reply.send({ _id: r.insertedId.toString(), ...doc });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/sessions.end', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      await db.collection('sessions').updateOne({ _id: new ObjectId(input.sessionId) }, { $set: { t_end: new Date().toISOString() } });
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


