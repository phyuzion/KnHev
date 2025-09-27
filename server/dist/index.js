import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { initTrpc } from './trpc.js';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { WebSocketServer } from 'ws';
dotenv.config({ path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env' });
const fastify = Fastify({ logger: process.env.PRETTY_LOG ? false : { level: process.env.LOG_LEVEL || 'info' } });
async function start() {
    await fastify.register(cors, { origin: true });
    // Firebase Admin init (ADC)
    if (!getApps().length) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
    fastify.decorate('verifyFirebaseIdToken', async (idToken) => {
        const decoded = await getAuth().verifyIdToken(idToken);
        return decoded;
    });
    if (process.env.SKIP_DB !== '1') {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            fastify.log?.error?.('MONGO_URI/MONGODB_URI is required');
            process.exit(1);
        }
        const client = new MongoClient(mongoUri);
        await client.connect();
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'knhev';
        const db = client.db(dbName);
        fastify.decorate('mongo', { client, db });
    }
    else {
        console.log(JSON.stringify({ tag: 'boot', note: 'Starting without Mongo connection (SKIP_DB=1)' }));
    }
    // health
    fastify.get('/health', async () => ({ ok: true }));
    // trpc
    await initTrpc(fastify);
    const port = Number(process.env.PORT || 3001);
    await fastify.listen({ port, host: '0.0.0.0' });
    // WS server (plain ws)
    const wss = new WebSocketServer({ server: fastify.server });
    const channels = {
        masterProposals: new Set(),
        schedulerJobs: new Set(),
    };
    fastify.wsChannels = channels;
    wss.on('connection', (socket, req) => {
        const url = req?.url || '';
        if (url.startsWith('/ws/master.proposals')) {
            channels.masterProposals.add(socket);
            socket.on('close', () => channels.masterProposals.delete(socket));
        }
        else if (url.startsWith('/ws/scheduler.jobs')) {
            channels.schedulerJobs.add(socket);
            socket.on('close', () => channels.schedulerJobs.delete(socket));
        }
        else {
            socket.close();
        }
    });
    console.log(JSON.stringify({ tag: 'boot', listening: { url: `http://127.0.0.1:${port}` } }));
}
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map