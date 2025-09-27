import type { FastifyInstance } from 'fastify';

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/trpc/auth.verify', async (req, reply) => {
    try {
      const idToken = ((req.body as any)?.input || {}).idToken as string;
      if (!idToken) return reply.code(400).send({ error: 'idToken_required' });
      const decoded = await (app as any).verifyFirebaseIdToken(idToken);
      reply.send({ uid: decoded.uid, email: decoded.email, claims: decoded });
    } catch (e: any) {
      reply.code(401).send({ error: 'invalid_token', message: e?.message });
    }
  });

  app.get('/trpc/auth.getSession', async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ error: 'unauthenticated' });
    reply.send({ userId: user.uid, email: user.email, roles: ['user'] });
  });
}


