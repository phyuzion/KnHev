export async function registerEnvBgmRoutes(app) {
    app.post('/trpc/env.getPreset', async (req, reply) => {
        try {
            const input = req.body?.input || {};
            const timePhase = input?.timePhase || 'day';
            const weather = input?.weather || 'clear';
            const preset = { _id: 'preset_demo', name: `${timePhase}_${weather}`, timePhase, weather, light: {}, fog: {}, particles: {}, post: {} };
            reply.send(preset);
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
    app.post('/trpc/bgm.tracks.pick', async (req, reply) => {
        try {
            const trackId = 'track_demo_1';
            reply.send({ trackId });
        }
        catch (e) {
            reply.code(500).send({ error: e?.message || 'error' });
        }
    });
}
//# sourceMappingURL=env_bgm.js.map