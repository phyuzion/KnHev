import type { FastifyInstance } from 'fastify';

export async function registerAiRuntimeRoutes(app: FastifyInstance) {
  app.post('/trpc/ai.perception.summarize', async (req, reply) => {
    try {
      const input = (req.body as any)?.input || {};
      const ser = input?.signals?.ser_label || 'neutral';
      const state = { need: 'grounding', level: 1, risk: 0, topics: [], user_tone: ser };
      reply.send({ state });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/ai.director.decideActions', async (_req, reply) => {
    try {
      const evt = { intent: 'comfort_pose', expr: 'concern', anim: 'idle_sit', ts: new Date().toISOString() };
      reply.send(evt);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


