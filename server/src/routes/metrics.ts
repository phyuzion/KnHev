import type { FastifyInstance } from 'fastify';

export async function registerMetricsRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/audio.pushClientStats', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const doc = {
        session_id: input.sessionId,
        window_id: input.window_id,
        ts: input.ts || new Date().toISOString(),
        pitch_mean: input.pitch_mean,
        pitch_var: input.pitch_var,
        energy_mean: input.energy_mean,
        energy_var: input.energy_var,
        mfcc32_stats: input.mfcc32_stats,
        speech_rate: input.speech_rate,
        vad_ratio: input.vad_ratio,
        ser_label: input.ser_label,
        ser_conf: input.ser_conf,
        risk_score: input.risk_score,
      };
      await db.collection('audio_windows').insertOne(doc);
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/metrics.upsertUserMetric', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const doc = { user_id: input.userId || (req as any).user?.uid || 'anon', ts: input.ts || new Date().toISOString(), ...input } as any;
      delete doc.userId;
      await db.collection('user_metrics').insertOne(doc);
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/interactions.log', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const doc = {
        user_id: input.userId || (req as any).user?.uid || 'anon',
        session_id: input.sessionId,
        ts: input.ts || new Date().toISOString(),
        type: input.type,
        intensity: input.intensity,
        position: input.position,
        meta: input.meta,
      };
      await db.collection('interactions').insertOne(doc);
      reply.send({ ok: true });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


