import type { FastifyInstance } from 'fastify';

export async function registerPreferenceRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/users.preferences.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const now = new Date().toISOString();
      const setDoc: any = {
        preferences: input.preferences || {},
        updated_at: now,
      };
      const r = await db.collection('user_preferences').findOneAndUpdate(
        { _id: userId },
        { $set: setDoc, $setOnInsert: { _id: userId, created_at: now } },
        { upsert: true, returnDocument: 'after' as const }
      );
      reply.send({ ...(r.value || {}), _id: userId });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.preferences.get', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req as any).user?.uid || (req.query as any)?.userId || 'anon';
      const doc = await db.collection('user_preferences').findOne({ _id: userId });
      reply.send(doc || { _id: userId, preferences: {} });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


