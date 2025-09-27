import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// 블록 리스트: 유저별 금지 주제/키워드/미디어/스켈레톤 키 등
// 최소 스키마: { _id: user_id, topics: string[], keywords: string[], media_ids: string[], skeleton_keys: string[] }
export async function registerBlocklistRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/users.blocklist.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        topics: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        media_ids: z.array(z.string()).optional(),
        skeleton_keys: z.array(z.string()).optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const filter = { _id: userId };
      const now = new Date().toISOString();
      const setDoc: any = { updated_at: now };
      if (Array.isArray(input.topics)) setDoc.topics = input.topics;
      if (Array.isArray(input.keywords)) setDoc.keywords = input.keywords;
      if (Array.isArray(input.media_ids)) setDoc.media_ids = input.media_ids;
      if (Array.isArray(input.skeleton_keys)) setDoc.skeleton_keys = input.skeleton_keys;
      const r = await db.collection('user_blocklist').findOneAndUpdate(
        filter,
        { $set: setDoc, $setOnInsert: { _id: userId, created_at: now } },
        { upsert: true, returnDocument: 'after' as const }
      );
      reply.send({ ...(r.value || {}), _id: userId });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.blocklist.get', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req as any).user?.uid || (req.query as any)?.userId || 'anon';
      const doc = await db.collection('user_blocklist').findOne({ _id: userId });
      reply.send(doc || { _id: userId, topics: [], keywords: [], media_ids: [], skeleton_keys: [] });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.blocklist.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('user_blocklist').find({}).sort({ _id: 1 }).limit(100).toArray();
      reply.send({ items });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


