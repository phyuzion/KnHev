export function setupRealtime(app) {
    const masterProposalClients = new Set();
    const schedulerJobClients = new Set();
    function sseSend(res, data) {
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
    function broadcastMasterProposal(message) {
        const payload = { channel: 'events.master.proposals', message };
        for (const res of masterProposalClients) {
            try {
                sseSend(res, payload);
            }
            catch { }
        }
        const wsSet = app.wsChannels?.masterProposals;
        if (wsSet) {
            const text = JSON.stringify({ channel: 'ws.master.proposals', message });
            for (const ws of wsSet) {
                try {
                    ws.send(text);
                }
                catch { }
            }
        }
    }
    function broadcastSchedulerJob(event) {
        const payload = { channel: 'events.scheduler.jobs', event };
        for (const res of schedulerJobClients) {
            try {
                sseSend(res, payload);
            }
            catch { }
        }
        const wsSet = app.wsChannels?.schedulerJobs;
        if (wsSet) {
            const text = JSON.stringify({ channel: 'ws.scheduler.jobs', event });
            for (const ws of wsSet) {
                try {
                    ws.send(text);
                }
                catch { }
            }
        }
    }
    return { broadcastMasterProposal, broadcastSchedulerJob };
}
//# sourceMappingURL=realtime.js.map