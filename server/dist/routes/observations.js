export async function registerObservationRoutes(app) {
    const db = app.mongo?.db;
    app.post('/trpc/ai.events.log', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const doc = {
                user_id: input.userId || req.user?.uid || 'anon',
                session_id: input.session_id || null,
                type: input.type,
                payload: input.payload || {},
                provider: input.provider || process.env.LLM_PROVIDER || 'gemini',
                model: input.model || process.env.GEMINI_MODEL || null,
                ts: input.ts || new Date().toISOString(),
            };
            const r = await db.collection('ai_events').insertOne(doc);
            reply.send({ _id: r.insertedId.toString() });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/sel.evaluations.upsert', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const doc = {
                user_id: input.userId || req.user?.uid || 'anon',
                session_id: input.session_id || null,
                ts: input.ts || new Date().toISOString(),
                scores: input.scores || {},
                rubric_version: input.rubric_version || 'v1',
            };
            const r = await db.collection('sel_evaluations').insertOne(doc);
            reply.send({ _id: r.insertedId.toString() });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=observations.js.map