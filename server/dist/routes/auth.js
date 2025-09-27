export async function registerAuthRoutes(app) {
    app.post('/trpc/auth.verify', async (req, reply) => {
        try {
            const idToken = (req.body?.input || {}).idToken;
            if (!idToken)
                return reply.code(400).send({ error: 'idToken_required' });
            const decoded = await app.verifyFirebaseIdToken(idToken);
            reply.send({ uid: decoded.uid, email: decoded.email, claims: decoded });
        }
        catch (e) {
            reply.code(401).send({ error: 'invalid_token', message: e?.message });
        }
    });
    app.get('/trpc/auth.getSession', async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ error: 'unauthenticated' });
        reply.send({ userId: user.uid, email: user.email, roles: ['user'] });
    });
}
//# sourceMappingURL=auth.js.map