export async function registerBibleRoutes(app) {
    const db = app.mongo?.db;
    const { ObjectId } = await import('mongodb');
    app.post('/trpc/bible.units.upsert', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const input = req.body?.input || {};
            const filter = {};
            if (input._id)
                filter._id = new ObjectId(input._id);
            const doc = {
                title: input.title,
                taxonomy: input.taxonomy,
                content: input.content,
                version: input.version || 'v1',
                updated_at: new Date().toISOString(),
            };
            const options = { upsert: true, returnDocument: 'after' };
            const r = await db.collection('sel_bible_units').findOneAndUpdate(filter, { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } }, options);
            const out = r.value ? { ...r.value, _id: r.value._id.toString() } : null;
            reply.send(out);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.get('/trpc/bible.units.get', async (req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const id = req.query?.id;
            if (!id)
                return reply.code(400).send({ error: 'id_required' });
            const doc = await db.collection('sel_bible_units').findOne({ _id: new ObjectId(id) });
            if (!doc)
                return reply.code(404).send({ error: 'not_found' });
            reply.send({ ...doc, _id: doc._id.toString() });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.get('/trpc/bible.units.list', async (_req, reply) => {
        try {
            if (!db)
                return reply.code(500).send({ error: 'db_not_ready' });
            const items = await db.collection('sel_bible_units').find({}).sort({ _id: -1 }).limit(50).toArray();
            reply.send({ items: items.map((d) => ({ ...d, _id: d._id.toString() })) });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=bible.js.map