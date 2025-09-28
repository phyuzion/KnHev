import type { FastifyInstance } from 'fastify';

export type Realtime = {
  broadcastMasterProposal: (message: any) => void;
  broadcastSchedulerJob: (event: any) => void;
  broadcastDialogueIntent: (event: any) => void;
  broadcastAiEvent: (event: any) => void;
};

export function setupRealtime(app: FastifyInstance): Realtime {
  const masterProposalClients = new Set<any>();
  const schedulerJobClients = new Set<any>();
  const dialogueIntentClients = new Set<any>();
  const aiEventClients = new Set<any>();

  function sseSend(res: any, data: any) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  app.get('/events/master.proposals', async (_req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    masterProposalClients.add(reply.raw);
    _req.raw.on('close', () => { masterProposalClients.delete(reply.raw); });
  });

  app.get('/events/scheduler.jobs', async (_req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    schedulerJobClients.add(reply.raw);
    _req.raw.on('close', () => { schedulerJobClients.delete(reply.raw); });
  });

  app.get('/events/dialogue.intents', async (_req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    dialogueIntentClients.add(reply.raw);
    _req.raw.on('close', () => { dialogueIntentClients.delete(reply.raw); });
  });

  app.get('/events/ai.events', async (_req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    aiEventClients.add(reply.raw);
    _req.raw.on('close', () => { aiEventClients.delete(reply.raw); });
  });

  function broadcastMasterProposal(message: any) {
    const payload = { channel: 'events.master.proposals', message };
    for (const res of masterProposalClients) {
      try { sseSend(res, payload); } catch {}
    }
    const wsSet: Set<any> | undefined = (app as any).wsChannels?.masterProposals;
    if (wsSet) {
      const text = JSON.stringify({ channel: 'ws.master.proposals', message });
      for (const ws of wsSet) { try { ws.send(text); } catch {} }
    }
  }

  function broadcastSchedulerJob(event: any) {
    const payload = { channel: 'events.scheduler.jobs', event };
    for (const res of schedulerJobClients) {
      try { sseSend(res, payload); } catch {}
    }
    const wsSet: Set<any> | undefined = (app as any).wsChannels?.schedulerJobs;
    if (wsSet) {
      const text = JSON.stringify({ channel: 'ws.scheduler.jobs', event });
      for (const ws of wsSet) { try { ws.send(text); } catch {} }
    }
  }

  function broadcastDialogueIntent(event: any) {
    const payload = { channel: 'events.dialogue.intents', event };
    for (const res of dialogueIntentClients) {
      try { sseSend(res, payload); } catch {}
    }
    const wsSet: Set<any> | undefined = (app as any).wsChannels?.dialogueIntents;
    if (wsSet) {
      const text = JSON.stringify({ channel: 'ws.dialogue.intents', event });
      for (const ws of wsSet) { try { ws.send(text); } catch {} }
    }
  }

  function broadcastAiEvent(event: any) {
    const payload = { channel: 'events.ai.events', event };
    for (const res of aiEventClients) {
      try { sseSend(res, payload); } catch {}
    }
    const wsSet: Set<any> | undefined = (app as any).wsChannels?.aiEvents;
    if (wsSet) {
      const text = JSON.stringify({ channel: 'ws.ai.events', event });
      for (const ws of wsSet) { try { ws.send(text); } catch {} }
    }
  }

  return { broadcastMasterProposal, broadcastSchedulerJob, broadcastDialogueIntent, broadcastAiEvent };
}


