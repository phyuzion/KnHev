import { z } from 'zod';
import type { FastifyInstance } from 'fastify';

export async function registerUserRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  // profile
  app.post('/trpc/users.profile.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        display_name: z.string().min(1).max(60).nullable().optional(),
        avatar_url: z.string().url().nullable().optional(),
        locale: z.enum(['ko','en']).optional(),
        bio: z.string().max(400).nullable().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const filter = { _id: userId };
      const doc: any = {
        display_name: input.display_name,
        avatar_url: input.avatar_url,
        locale: input.locale || 'ko',
        bio: input.bio,
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('user_profiles').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { _id: userId, created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      reply.send({ ...(r.value || {}), _id: userId });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.profile.get', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req.query as any)?.userId || (req as any).user?.uid || 'anon';
      const doc = await db.collection('user_profiles').findOne({ _id: userId });
      reply.send(doc ? { ...doc, _id: userId } : null);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // settings
  app.post('/trpc/users.settings.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({ userId: z.string().optional(), settings: z.record(z.string(), z.any()) });
      const input = schema.parse(((req.body as any)?.input || {}));
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const filter = { _id: userId };
      const doc: any = {
        settings: input.settings || {},
        updated_at: new Date().toISOString(),
      };
      const r = await db.collection('user_settings').findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { _id: userId, created_at: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' as const }
      );
      reply.send({ ...(r.value || {}), _id: userId });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.settings.get', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req.query as any)?.userId || (req as any).user?.uid || 'anon';
      const doc = await db.collection('user_settings').findOne({ _id: userId });
      reply.send(doc ? { ...doc, _id: userId } : { _id: userId, settings: {} });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  // devices
  app.post('/trpc/users.devices.upsert', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const schema = z.object({
        userId: z.string().optional(),
        device_id: z.string().min(1),
        platform: z.string().min(1),
        model: z.string().nullable().optional(),
        app_version: z.string().nullable().optional(),
        meta: z.record(z.string(), z.any()).nullable().optional(),
      });
      const input = schema.parse(((req.body as any)?.input || {}));
      const userId = input.userId || (req as any).user?.uid || 'anon';
      const now = new Date().toISOString();
      const setDoc = {
        user_id: userId,
        device_id: input.device_id,
        platform: input.platform,
        model: input.model,
        app_version: input.app_version,
        meta: input.meta,
        updated_at: now,
      };
      const onInsert = { user_id: userId, device_id: input.device_id, created_at: now };
      await db.collection('user_devices').findOneAndUpdate(
        { user_id: userId, device_id: input.device_id },
        { $set: setDoc, $setOnInsert: onInsert },
        { upsert: true }
      );
      reply.send({ ok: true });
    } catch (e: any) { if (e?.name==='ZodError') return reply.code(400).send({ error:'invalid_input', issues: e.issues }); reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/users.devices.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const userId = (req.query as any)?.userId || (req as any).user?.uid || 'anon';
      const items = await db.collection('user_devices').find({ user_id: userId }).sort({ updated_at: -1 }).limit(20).toArray();
      reply.send({ items });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


