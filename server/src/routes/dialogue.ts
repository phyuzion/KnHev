import type { FastifyInstance } from 'fastify';
import { generateText } from '../llm/adapter.js';

export async function registerDialogueRoutes(app: FastifyInstance) {
  const db: any = (app as any).mongo?.db;

  app.post('/trpc/dialogue.sendUserText', async (req, reply) => {
    try {
      if (!db) return reply.code(500).send({ error: 'db_not_ready' });
      const input = (req.body as any)?.input || {};
      const sessionId = input.sessionId;
      const text = input.text || '';
      const userTurn = { session_id: sessionId, role: 'user', text, created_at: new Date().toISOString() };
      const insUser = await db.collection('dialogue_turns').insertOne(userTurn);
      const system = 'You are a warm Korean emotional companion. Keep responses gentle and short.';
      const aiText = await generateText({ prompt: text, system, locale: 'ko' });
      const aiTurn = { session_id: sessionId, role: 'ai', text: aiText, created_at: new Date().toISOString() };
      await db.collection('dialogue_turns').insertOne(aiTurn);
      reply.send({ turnId: insUser.insertedId.toString(), reply: { text: aiText } });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


