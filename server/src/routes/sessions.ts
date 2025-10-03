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

  // get-or-create single persistent session per user
  app.post('/trpc/sessions.ensure', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const userId = input.userId || (req as any).user?.uid || 'anon';
      // if there is an open session (t_end not set) return the latest; else return latest by t_start; else create
      const open = await db.collection('sessions')
        .find({ user_id: userId, t_end: { $exists: false } })
        .sort({ t_start: -1 })
        .limit(1)
        .toArray();
      if (open[0]) {
        // write-through to user_profiles
        await db.collection('user_profiles').updateOne(
          { _id: userId },
          { $set: { current_session_id: open[0]._id.toString?.() || String(open[0]._id), updated_at: new Date().toISOString() } },
          { upsert: true }
        );
        return reply.send({ _id: open[0]._id.toString?.() || String(open[0]._id), ...open[0] });
      }
      const latest = await db.collection('sessions')
        .find({ user_id: userId })
        .sort({ t_start: -1 })
        .limit(1)
        .toArray();
      if (latest[0]) {
        await db.collection('user_profiles').updateOne(
          { _id: userId },
          { $set: { current_session_id: latest[0]._id.toString?.() || String(latest[0]._id), updated_at: new Date().toISOString() } },
          { upsert: true }
        );
        return reply.send({ _id: latest[0]._id.toString?.() || String(latest[0]._id), ...latest[0] });
      }
      const now = new Date().toISOString();
      const doc = { user_id: userId, device_info: null, t_start: now };
      const r = await db.collection('sessions').insertOne(doc);
      const sid = r.insertedId.toString();
      await db.collection('user_profiles').updateOne(
        { _id: userId },
        { $set: { current_session_id: sid, updated_at: now } },
        { upsert: true }
      );
      return reply.send({ _id: sid, ...doc });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/sessions.end', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const now = new Date().toISOString();
      await db.collection('sessions').updateOne({ _id: new ObjectId(input.sessionId) }, { $set: { t_end: now } });
      if (input.userId) {
        await db.collection('user_profiles').updateOne(
          { _id: input.userId, current_session_id: input.sessionId },
          { $unset: { current_session_id: '' }, $set: { updated_at: now } }
        );
      }
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.get('/trpc/sessions.list', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const q = (req.query as any) || {};
      const userId = q.userId || (req as any).user?.uid || 'anon';
      const limit = Math.min(Number(q.limit || 20), 100);
      const items = await db.collection('sessions')
        .find({ user_id: userId })
        .sort({ t_start: -1 })
        .limit(limit)
        .toArray();
      reply.send({ items });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


