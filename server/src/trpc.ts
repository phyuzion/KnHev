import { initTRPC } from '@trpc/server';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateText } from './llm/adapter.js';
import { setupRealtime } from './realtime.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerBibleRoutes } from './routes/bible.js';
import { registerKnowledgeRoutes } from './routes/knowledge.js';
import { registerSkeletonRoutes } from './routes/skeletons.js';
import { registerSchedulerRoutes } from './routes/scheduler.js';
import { registerSummariesRoutes } from './routes/summaries.js';
import { registerEnvBgmRoutes } from './routes/env_bgm.js';
import { registerObservationRoutes } from './routes/observations.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerDialogueRoutes } from './routes/dialogue.js';
import { registerUserRoutes } from './routes/users.js';
import { registerAssets3DRoutes } from './routes/assets3d.js';
import { registerBlocklistRoutes } from './routes/blocklist.js';
import { registerAiRuntimeRoutes } from './routes/ai_runtime.js';
import { registerPreferenceRoutes } from './routes/preferences.js';
import { registerProgressRoutes } from './routes/progress.js';
import { registerStorageRoutes } from './routes/storage.js';
import { registerScenarioRoutes } from './routes/scenarios.js';
import { registerCurriculumRoutes } from './routes/curriculum.js';

function log(evt: any) {
  console.log(JSON.stringify(evt));
}

export async function initTrpc(app: FastifyInstance) {
  const t = initTRPC.create();

  const rt = setupRealtime(app);

  // Simple in-memory rate limiter (per IP + route key)
  const rateCounters = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === '1';
  const AI_REPLY_RPM = Number(process.env.AI_REPLY_RPM || '20');
  const DEFAULT_RPM = Number(process.env.DEFAULT_RPM || '120');
  function allowRate(ip: string, key: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const bucketKey = `${ip}:${key}`;
    const entry = rateCounters.get(bucketKey);
    if (!entry || entry.resetAt < now) {
      rateCounters.set(bucketKey, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count < limitPerMinute) {
      entry.count += 1;
      return true;
    }
    return false;
  }

  const router = t.router({
    health: t.procedure.query(() => ({ ok: true }))
  });

  app.addHook('onRequest', async (req, _reply) => {
    // attach user if Authorization: Bearer <idToken>
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      try {
        const decoded = await (app as any).verifyFirebaseIdToken(token);
        (req as any).user = { uid: decoded.uid, email: decoded.email };
      } catch {
        // ignore, keep unauthenticated
      }
    }
    // naive per-route rate limits
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';
    const url = req.url || '';
    const key = url.startsWith('/trpc/ai.reply.generate') ? 'ai_reply' : 'default';
    const limit = key === 'ai_reply' ? AI_REPLY_RPM : DEFAULT_RPM; // per minute
    if (!RATE_LIMIT_DISABLED && !allowRate(String(ip), key, limit)) {
      (req as any)._rateLimited = true;
    }
    log({ tag: 'req', method: req.method, url: req.url, input: (req.body as any)?.input });
  });
  app.addHook('preHandler', async (req, reply) => {
    if ((req as any)._rateLimited) return reply.code(429).send({ error: 'rate_limited' });
  });
  app.addHook('onSend', async (_req, _reply, payload) => {
    try { log({ tag: 'res', body: JSON.parse(payload as any) }); } catch { log({ tag: 'res', body: String(payload) }); }
  });

  // auth helper
  (app as any).ensureAuth = (req: any, reply: any) => {
    if (!req?.user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    return req.user;
  };

  await registerAuthRoutes(app);
  await registerAiRoutes(app, rt);
  await registerBibleRoutes(app);
  await registerKnowledgeRoutes(app);
  await registerSkeletonRoutes(app);
  await registerSchedulerRoutes(app, rt);
  await registerSummariesRoutes(app);
  await registerEnvBgmRoutes(app);
  await registerObservationRoutes(app);
  await registerSessionRoutes(app);
  await registerDialogueRoutes(app);
  await registerUserRoutes(app);
  await registerAssets3DRoutes(app);
  await registerBlocklistRoutes(app);
  await registerAiRuntimeRoutes(app);
  await registerPreferenceRoutes(app);
  await registerProgressRoutes(app);
  await registerStorageRoutes(app);
  await registerScenarioRoutes(app);
  await registerCurriculumRoutes(app);

  // auth 라우트는 routes/auth.ts에서 등록

  // ai.reply.generate는 routes/ai.ts에서 등록

  const db: any = (app as any).mongo?.db;
  const { ObjectId } = await import('mongodb');

  // bible.* 모듈로 이동

  // knowledge.* 모듈로 이동

  // skeletons.* 모듈로 이동

  // ai.events.* 모듈로 이동

  // sel.evaluations.* 모듈로 이동

  // summaries.daily.* 모듈로 이동

  // scenario.plays.* 는 summaries/observations로 분리 예정이지만 유지 가능

  // history.search 는 summaries 모듈로 이동

  // ai.master 라우트는 routes/ai.ts에서 등록

  // scheduler.jobs.* 는 routes/scheduler.ts에서 등록

  // users.getMe 는 sessions 모듈로 이동

  // sessions.* 모듈로 이동

  // dialogue.* 모듈로 이동

  // metrics/audio/interactions.* 모듈로 이동

  // summaries.session.* 모듈로 이동

  // env/bgm.* 모듈로 이동

  // ai.perception/director 는 추후 모듈화 예정
}
