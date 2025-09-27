import { initTRPC } from '@trpc/server';
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
function log(evt) {
    console.log(JSON.stringify(evt));
}
export async function initTrpc(app) {
    const t = initTRPC.create();
    const rt = setupRealtime(app);
    const router = t.router({
        health: t.procedure.query(() => ({ ok: true }))
    });
    app.addHook('onRequest', async (req, _reply) => {
        // attach user if Authorization: Bearer <idToken>
        const auth = req.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
            const token = auth.slice('Bearer '.length);
            try {
                const decoded = await app.verifyFirebaseIdToken(token);
                req.user = { uid: decoded.uid, email: decoded.email };
            }
            catch {
                // ignore, keep unauthenticated
            }
        }
        log({ tag: 'req', method: req.method, url: req.url, input: req.body?.input });
    });
    app.addHook('onSend', async (_req, _reply, payload) => {
        try {
            log({ tag: 'res', body: JSON.parse(payload) });
        }
        catch {
            log({ tag: 'res', body: String(payload) });
        }
    });
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
    // auth 라우트는 routes/auth.ts에서 등록
    // ai.reply.generate는 routes/ai.ts에서 등록
    const db = app.mongo?.db;
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
    // --- scheduler.jobs ---
    app.post('/trpc/scheduler.jobs.enqueue', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const job = {
                type: input?.type || 'autopilot_eval',
                payload: input?.payload || {},
                status: 'queued',
                created_at: new Date().toISOString(),
            };
            const r = await db.collection('scheduler_tasks').insertOne(job);
            const out = { jobId: r.insertedId.toString(), ...job };
            rt.broadcastSchedulerJob({ type: 'enqueued', job: out });
            reply.send(out);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.get('/trpc/scheduler.jobs.list', async (_req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const items = await db.collection('scheduler_tasks').find({}).sort({ _id: -1 }).limit(50).toArray();
            reply.send({ items: items.map((d) => ({ ...d, _id: d._id.toString() })) });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    // users.getMe 는 sessions 모듈로 이동
    // sessions.* 모듈로 이동
    // dialogue.* 모듈로 이동
    // metrics/audio/interactions.* 모듈로 이동
    // summaries.session.* 모듈로 이동
    // env/bgm.* 모듈로 이동
    // ai.perception/director 는 추후 모듈화 예정
}
//# sourceMappingURL=trpc.js.map