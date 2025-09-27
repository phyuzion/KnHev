export async function registerSessionRoutes(app) {
    const db = app.mongo?.db;
    const { ObjectId } = await import('mongodb');
    app.get('/trpc/users.getMe', async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ error: 'unauthenticated' });
        reply.send({ _id: user.uid, email: user.email, locale: 'ko', created_at: new Date().toISOString() });
    });
    app.post('/trpc/sessions.create', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const doc = { user_id: input.userId || req.user?.uid || 'anon', device_info: input.device_info || null, t_start: new Date().toISOString() };
            const r = await db.collection('sessions').insertOne(doc);
            reply.send({ _id: r.insertedId.toString(), ...doc });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/sessions.end', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            await db.collection('sessions').updateOne({ _id: new ObjectId(input.sessionId) }, { $set: { t_end: new Date().toISOString() } });
            reply.send({ ok: true });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=sessions.js.map