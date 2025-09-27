import { generateText } from '../llm/adapter.js';
export async function registerAiRoutes(app, rt) {
    app.post('/trpc/ai.reply.generate', async (req, reply) => {
        try {
            const input = req.body?.input ?? {};
            const prompt = input.text ?? '...';
            const system = 'You are a warm Korean emotional companion. Keep responses gentle and short.';
            const text = await generateText({ prompt, system, locale: input.locale || 'ko' });
            reply.send({ text, safety: { flagged: false } });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/ai.master.propose', async (req, reply) => {
        try {
            const input = req.body?.input || {};
            const draft = {
                _id: Date.now().toString(16),
                author: req.user?.uid || 'system',
                created_at: new Date().toISOString(),
                skeleton: input?.skeleton || { name: 'BASE_SKEL_V1', steps: [] },
                notes: input?.notes || null,
            };
            rt.broadcastMasterProposal({ type: 'proposal', draft });
            reply.send({ ok: true, draftId: draft._id });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/ai.master.validate', async (req, reply) => {
        try {
            const input = req.body?.input || {};
            const result = { draftId: input?.draftId, valid: true, score: 0.92 };
            reply.send(result);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/ai.master.shadowTest', async (req, reply) => {
        try {
            const input = req.body?.input || {};
            const result = { draftId: input?.draftId, runs: 5, passRate: 0.8 };
            reply.send(result);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/ai.master.promote', async (req, reply) => {
        try {
            const input = req.body?.input || {};
            const result = { draftId: input?.draftId, promoted: true, version: 'v1' };
            reply.send(result);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=ai.js.map