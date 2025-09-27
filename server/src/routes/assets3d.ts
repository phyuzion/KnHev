import type { FastifyInstance } from 'fastify';

export async function registerAssets3DRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  // assets (Cloudflare R2에 업로드된 메타를 관리)
  app.post('/trpc/assets3d.assets.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc: any = {
        name: input.name,
        kind: input.kind || 'model', // model|texture|audio|anim
        r2_key: input.r2_key,
        content_type: input.content_type,
        bytes: input.bytes,
        tags: input.tags || [],
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('assets3d_assets').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/assets3d.assets.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('assets3d_assets').find({}).sort({ _id: -1 }).limit(50).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // scene presets
  app.post('/trpc/assets3d.scenes.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc: any = {
        name: input.name,
        description: input.description,
        nodes: input.nodes || [],
        env: input.env || {},
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('assets3d_scenes').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/assets3d.scenes.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('assets3d_scenes').find({}).sort({ _id: -1 }).limit(50).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // animations registry (메타정보)
  app.post('/trpc/assets3d.anims.upsert', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const filter: any = {};
      if (input._id) filter._id = new ObjectId(input._id);
      const doc: any = {
        name: input.name,
        character: input.character || 'pet',
        r2_key: input.r2_key,
        tags: input.tags || [],
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('assets3d_anims').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
      reply.send(out);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/assets3d.anims.list', async (_req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const items = await db.collection('assets3d_anims').find({}).sort({ _id: -1 }).limit(50).toArray();
      reply.send({ items: items.map((d: any) => ({ ...d, _id: d._id.toString() })) });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


