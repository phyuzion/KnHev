import type { FastifyInstance } from 'fastify';

export async function registerProgressRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  // 코칭 진행도(스켈레톤/유닛별 레벨/스코어)
  app.post('/trpc/users.progress.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const key = input.key; // 예: "EMPATHY_L1_V1" 혹은 unit_id
      const now = new Date().toISOString();
      const setDoc: any = {
        user_id: userId,
        key,
        level: input.level,
        score: input.score,
        streak: input.streak,
        last_ts: now,
      };
      await db.collection('user_progress').findOneAndUpdate(
        { user_id: userId, key },
        { $set: setDoc, $setOnInsert: { created_at: now } },
        { upsert: true }
      );
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.progress.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req as any).user?.uid || (req.query as any)?.userId || 'anon';
      const items = await db.collection('user_progress').find({ user_id: userId }).sort({ last_ts: -1 }).limit(100).toArray();
      reply.send({ items });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


