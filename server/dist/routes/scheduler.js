export async function registerSchedulerRoutes(app, rt) {
    const db = app.mongo?.db;
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
}
//# sourceMappingURL=scheduler.js.map