import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import fs from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env' });

function log(msg: any) { console.log(JSON.stringify(msg)); }

async function readJson(filePath: string): Promise<any> {
  const text = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(text);
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) { throw new Error('MONGO_URI/MONGODB_URI is required'); }
  const client = new MongoClient(mongoUri);
  await client.connect();
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'knhev';
  const db = client.db(dbName);
  const root = process.cwd();
  const seedsRoot = path.resolve(root, '../plan_doc/seeds');

  // 1) Coaching Skeletons
  const skelDir = path.join(seedsRoot, 'skeletons');
  try {
    const files = (await fs.readdir(skelDir)).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const p = path.join(skelDir, f);
      const data = await readJson(p);
      const key = (data.key as string) || path.basename(f, '.json');
      const doc = {
        key,
        name: (data.name as string) || key,
        version: (data.version as string) || 'v1',
        status: (data.status as string) || 'seeded',
        steps: Array.isArray(data.steps) ? data.steps : data,
        meta: data.meta || {},
        updated_at: new Date().toISOString(),
      };
      await db.collection('coaching_skeletons').findOneAndUpdate(
        { key },
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true }
      );
      log({ tag: 'seed.skeleton', key, file: f });
    }
  } catch (e) { log({ tag: 'seed.skeleton.error', message: (e as any)?.message }); }

  // 2) Knowledge Packs
  const kpDir = path.join(seedsRoot, 'knowledge_packs');
  try {
    const files = (await fs.readdir(kpDir)).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const p = path.join(kpDir, f);
      const data = await readJson(p);
      const name = (data.name as string) || path.basename(f, '.json');
      const doc = {
        name,
        version: (data.version as string) || 'v1',
        content: data,
        updated_at: new Date().toISOString(),
      };
      await db.collection('knowledge_packs').findOneAndUpdate(
        { name },
        { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
        { upsert: true }
      );
      log({ tag: 'seed.knowledge_pack', name, file: f });
    }
  } catch (e) { log({ tag: 'seed.knowledge_pack.error', message: (e as any)?.message }); }

  // 3) Action Mapping
  try {
    const amPath = path.join(seedsRoot, 'mapping', 'action_mapping_v1.json');
    const data = await readJson(amPath);
    const id_code: string = data.id_code || 'ACTION_MAPPING_V1';
    const doc = { id_code, map: data.map || [], updated_at: new Date().toISOString() };
    await db.collection('action_mappings').findOneAndUpdate(
      { id_code },
      { $set: doc, $setOnInsert: { created_at: new Date().toISOString() } },
      { upsert: true }
    );
    log({ tag: 'seed.action_mapping', id_code, file: 'mapping/action_mapping_v1.json' });
  } catch (e) { log({ tag: 'seed.action_mapping.error', message: (e as any)?.message }); }

  await client.close();
  log({ tag: 'seed.done' });
}

main().catch((e) => { console.error(e); process.exit(1); });


