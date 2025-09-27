import type { FastifyInstance } from 'fastify';
export type Realtime = {
    broadcastMasterProposal: (message: any) => void;
    broadcastSchedulerJob: (event: any) => void;
};
export declare function setupRealtime(app: FastifyInstance): Realtime;
//# sourceMappingURL=realtime.d.ts.map