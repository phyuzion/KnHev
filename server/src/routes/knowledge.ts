import type { FastifyInstance } from 'fastify';

export async function registerKnowledgeRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/knowledge.packs.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const filter: any = {};
      if (input._id) {
        const { ObjectId } = await import('mongodb');
        filter._id = new ObjectId(input._id);
      }
      const doc: any = {
        name: input.name,
        version: input.version || 'v1',
        content: input.content,
        updated_at: new Date().toISOString(),
      };
      const options = { upsert: true, returnDocument: 'after' as const };
      const r = await db.collection('knowledge_packs').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        options
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/knowledge.packs.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('knowledge_packs').find({}).sort({ _id: -1 }).limit(50).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


