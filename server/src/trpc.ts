import { initTRPC } from '@trpc/server';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateText } from './llm/adapter.js';
import { setupRealtime } from './realtime.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAdminAuthRoutes } from './routes/admin_auth.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerBibleRoutes } from './routes/bible.js';
import { registerKnowledgeRoutes } from './routes/knowledge.js';
import { registerBibleRulesRoutes } from './routes/bible_rules.js';
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
  (app as any)._realtime = rt;

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
      // Try admin JWT first
      const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'devsecret';
      try {
        const decoded: any = await (async () => {
          const { default: jwt } = await import('jsonwebtoken');
          return jwt.verify(token, JWT_SECRET);
        })();
        if (decoded && decoded.kind === 'admin') {
          (req as any).user = { uid: decoded.sub, email: `${decoded.sub}@admin.local`, roles: decoded.roles || ['admin'] };
        }
      } catch {
        // Fallback: Firebase ID token
        try {
          const decoded = await (app as any).verifyFirebaseIdToken(token);
          (req as any).user = { uid: decoded.uid, email: decoded.email };
        } catch {
          // ignore, keep unauthenticated
        }
      }
    }
    // Dev bypass: allow local development without Firebase token
    if (!(req as any).user && process.env.DEV_AUTH_BYPASS === '1') {
      const devUid = (req.headers['x-user-id'] as string) || 'dev-admin';
      (req as any).user = { uid: devUid, email: `${devUid}@local.dev` };
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
      if (process.env.DEV_AUTH_BYPASS === '1') {
        req.user = { uid: 'dev-admin', email: 'dev-admin@local.dev' };
        return req.user;
      }
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    return req.user;
  };

  (app as any).ensureAdmin = (req: any, reply: any) => {
    const user = (app as any).ensureAuth(req, reply);
    if (!user) return null;
    const roles: string[] = Array.isArray(user.roles) ? user.roles : (req?.user?.roles || []);
    const isAdmin = roles.includes('admin') || user.uid === 'dev-admin';
    if (!isAdmin) {
      reply.code(403).send({ error: 'forbidden' });
      return null;
    }
    return user;
  };

  await registerAuthRoutes(app);
  await registerAdminAuthRoutes(app);
  await registerAiRoutes(app, rt);
  await registerBibleRoutes(app);
  await registerBibleRulesRoutes(app);
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
}
