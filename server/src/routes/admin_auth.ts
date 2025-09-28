import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

type AdminUser = { _id?: any; username: string; password_hash: string; salt: string; roles: string[]; created_at: string };

function hashPassword(password: string, salt: string): string {
  const buf = crypto.scryptSync(password, salt, 64);
  return buf.toString('hex');
}

export async function registerAdminAuthRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'devsecret';

  // seed default admin if none exists
  try {
    const count = await db.collection('admin_users').countDocuments({});
    if (count === 0) {
      const salt = crypto.randomBytes(16).toString('hex');
      const password_hash = hashPassword('1111', salt);
      const doc: AdminUser = { username: 'admin', password_hash, salt, roles: ['admin'], created_at: new Date().toISOString() };
      await db.collection('admin_users').insertOne(doc);
      app.log?.info?.({ tag: 'admin_seeded', username: 'admin' });
    }
  } catch (e) { app.log?.error?.({ tag: 'admin_seed_failed', error: (e as any)?.message }); }

  app.post('/trpc/admin.login', async (req, reply) => {
    try {
      const input = ((req.body as any)?.input) || {};
      const username = String(input.username || '').trim();
      const password = String(input.password || '');
      if (!username || !password) return reply.code(400).send({ error: 'missing_credentials' });
      const user: AdminUser | null = await db.collection('admin_users').findOne({ username });
      if (!user) return reply.code(401).send({ error: 'invalid_credentials' });
      const calc = hashPassword(password, user.salt);
      if (calc !== user.password_hash) return reply.code(401).send({ error: 'invalid_credentials' });
      const token = jwt.sign({ sub: user.username, roles: user.roles, kind: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '7d' });
      reply.send({ token, user: { username: user.username, roles: user.roles } });
    } catch (e: any) {
      reply.code(500).send({ error: 'login_failed', message: e?.message });
    }
  });

  app.get('/trpc/admin.session', async (req, reply) => {
    try {
      const user = (req as any).user;
      if (!user) return reply.code(401).send({ error: 'unauthenticated' });
      reply.send({ user });
    } catch (e: any) {
      reply.code(500).send({ error: 'session_failed', message: e?.message });
    }
  });
}


