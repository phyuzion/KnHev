import type { FastifyInstance } from 'fastify';
import { generateText } from '../llm/adapter.js';
import { z } from 'zod';
import type { Realtime } from '../realtime.js';

export async function registerAiRoutes(app: FastifyInstance, rt: Realtime) {
  app.post('/trpc/ai.reply.generate', async (req, reply) => {
    try {
      const schema = z.object({
        text: z.string().min(1).max(4000),
        locale: z.enum(['ko','en']).optional(),
      });
      const input = schema.parse(((req.body as any)?.input ?? {}));
      const prompt = input.text ?? '...';
      const userId = (req as any).user?.uid || 'anon';
      const db: any = (app as any).mongo?.db;

      let blocklist: any = null;
      let preferences: any = null;
      if (db) {
        const [bl, pref] = await Promise.all([
          db.collection('user_blocklist').findOne({ _id: userId }),
          db.collection('user_preferences').findOne({ _id: userId })
        ]);
        blocklist = bl || { topics: [], keywords: [], skeleton_keys: [] };
        preferences = pref?.preferences || {};
      }

      const blockedKeywords: string[] = Array.isArray(blocklist?.keywords) ? blocklist.keywords : [];
      const blockedTopics: string[] = Array.isArray(blocklist?.topics) ? blocklist.topics : [];
      const containsBlocked = (text: string) => blockedKeywords.some((k) => k && typeof k === 'string' && text.includes(k));
      const containsTopic = (text: string) => blockedTopics.some((t) => t && typeof t === 'string' && text.includes(t));

      if (containsBlocked(prompt) || containsTopic(prompt)) {
        const reason = containsBlocked(prompt) ? 'blocked_keyword' : 'blocked_topic';
        const safeText = '그 주제는 불편할 수 있어요. 대신 지금 마음을 편하게 해줄 얘기나 음악을 함께 들어볼까요?';
        if (db) {
          await db.collection('ai_events').insertOne({
            user_id: userId,
            type: 'safety.blocked',
            payload: { input_text: prompt, reason, blockedKeywords, blockedTopics },
            provider: process.env.LLM_PROVIDER || 'gemini',
            model: process.env.GEMINI_MODEL || null,
            ts: new Date().toISOString(),
          });
        }
        return reply.send({ text: safeText, safety: { flagged: true, reason } });
      }

      const styleLocale = (preferences?.lang === 'en') ? 'en' : (input.locale || 'ko');
      const avoidList = blockedKeywords.filter(Boolean).slice(0, 16).join(', ');
      const system = `You are a warm Korean emotional companion. Keep responses gentle and short.
Avoid these keywords/topics entirely: ${avoidList || 'none'}.
If the user touches on avoided topics, gently steer to safe, soothing conversation or music suggestions.`;
      const text = await generateText({ prompt, system, locale: styleLocale });
      if (db) {
        await db.collection('ai_events').insertOne({
          user_id: userId,
          type: 'ai.reply',
          payload: { input_text: prompt, output_text: text },
          provider: process.env.LLM_PROVIDER || 'gemini',
          model: process.env.GEMINI_MODEL || null,
          ts: new Date().toISOString(),
        });
      }
      reply.send({ text, safety: { flagged: false } });
    } catch (e: any) {
      if (e?.name === 'ZodError') return reply.code(400).send({ error: 'invalid_input', issues: e.issues });
      reply.code(500).send({ error: e?.message || 'error' });
    }
  });

  app.post('/trpc/ai.master.propose', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      const input = (req.body as any)?.input || {};
      const draft = {
        _id: Date.now().toString(16),
        author: (req as any).user?.uid || 'system',
        created_at: new Date().toISOString(),
        skeleton: input?.skeleton || { name: 'BASE_SKEL_V1', steps: [] },
        notes: input?.notes || null,
      };
      rt.broadcastMasterProposal({ type: 'proposal', draft });
      reply.send({ ok: true, draftId: draft._id });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/ai.master.validate', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      const input = (req.body as any)?.input || {};
      const result = { draftId: input?.draftId, valid: true, score: 0.92 };
      reply.send(result);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/ai.master.shadowTest', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      const input = (req.body as any)?.input || {};
      const result = { draftId: input?.draftId, runs: 5, passRate: 0.8 };
      reply.send(result);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });

  app.post('/trpc/ai.master.promote', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth(req, reply)) return;
      const input = (req.body as any)?.input || {};
      const result = { draftId: input?.draftId, promoted: true, version: 'v1' };
      reply.send(result);
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


