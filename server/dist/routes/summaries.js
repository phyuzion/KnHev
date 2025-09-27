export async function registerSummariesRoutes(app) {
    const db = app.mongo?.db;
    app.post('/trpc/summaries.session.upsert', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const doc = {
                user_id: input.userId || req.user?.uid || 'anon',
                session_id: input.session_id,
                ts: input.ts || new Date().toISOString(),
                summary_text: input.summary_text,
                topics: input.topics,
                key_points: input.key_points,
                mood_delta: input.mood_delta,
                sel_delta: input.sel_delta,
            };
            await db.collection('session_summaries').insertOne(doc);
            reply.send({ ok: true });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/summaries.daily.upsert', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const filter = { user_id: input.userId || req.user?.uid || 'anon', date: input.date };
            const doc = {
                summary_text: input.summary_text,
                mood_delta: input.mood_delta,
                sel_delta: input.sel_delta,
                updated_at: new Date().toISOString(),
            };
            const r = await db.collection('daily_summaries').findOneAndUpdate(filter, { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } }, { upsert: true, returnDocument: 'after' });
            reply.send(r.value ? { ...r.value, _id: r.value._id.toString() } : null);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.get('/trpc/history.search', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const q = req.query?.q;
            const userId = req.query?.userId;
            if (!q)
                return reply.code(400).send({ error: 'q_required' });
            const filter = { summary_text: { $regex: q, $options: 'i' } };
            if (userId)
                filter.user_id = userId;
            const items = await db.collection('session_summaries').find(filter).sort({ _id: -1 }).limit(20).toArray();
            reply.send({ items: items.map((d) => ({ _id: d._id.toString(), session_id: d.session_id, ts: d.ts, summary_text: d.summary_text, topics: d.topics || [] })) });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=summaries.js.map