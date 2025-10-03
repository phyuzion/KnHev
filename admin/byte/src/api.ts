export type Scenario = {
  _id?: string;
  title: string;
  domain: 'assessment' | 'intervention';
  tags?: string[];
  version?: string;
  inputs?: Record<string, unknown>;
  steps: Array<Record<string, unknown>>;
  scoring?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  updated_at?: string;
  created_at?: string;
};

export type CurriculumUnit = {
  _id?: string;
  title: string;
  taxonomy?: Record<string, unknown>;
  activities: Array<Record<string, unknown>>;
  rubric_refs?: string[];
  version?: string;
  updated_at?: string;
  created_at?: string;
};

export type UserProfile = { _id?: string; user_id?: string; displayName?: string; locale?: 'ko'|'en'; bio?: string; avatar_url?: string };
export type UserSettings = { _id?: string; user_id?: string; notifications?: Record<string, unknown>; privacy?: Record<string, unknown> };
export type UserDevice = { _id?: string; user_id?: string; device_id: string; platform?: string; model?: string; meta?: Record<string, unknown> };

// Assets3D
export type Asset3D = { _id?: string; title: string; type: 'background'|'skybox'|'prop'|'audio'|'fx'|'character'|'scene'|'anim'; uri?: string; version?: string; meta?: Record<string, unknown>; updated_at?: string };
export type Scene3D = { _id?: string; title: string; points?: any[]; props?: any[]; version?: string; updated_at?: string };
export type Anim3D = { _id?: string; title: string; target?: string; clip?: string; version?: string; updated_at?: string };

import { fetchJson } from './lib/http'
export { getApiBase, setApiBase, setIdToken } from './lib/config'
// Admin Auth
export async function adminLogin(input: { username: string; password: string }): Promise<{ token: string; user: { username: string; roles: string[] } }> {
  return fetchJson('/trpc/admin.login', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function adminGetSession(): Promise<{ user: any }> {
  return fetchJson('/trpc/admin.session')
}


export async function listScenarios(): Promise<{ items: Scenario[] }> {
  return fetchJson('/trpc/scenarios.list');
}

export async function upsertScenario(input: Partial<Scenario>): Promise<Scenario> {
  return fetchJson('/trpc/scenarios.upsert', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function listCurriculumUnits(): Promise<{ items: CurriculumUnit[] }> {
  return fetchJson('/trpc/curriculum.units.list');
}

export async function upsertCurriculumUnit(input: Partial<CurriculumUnit>): Promise<CurriculumUnit> {
  return fetchJson('/trpc/curriculum.units.upsert', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function upsertCurriculumPlan(input: { horizon_weeks: number; items: Array<{ day:number; type:'activity'|'scenario'; ref:string; notes?:string }> }): Promise<{ _id: string }> {
  return fetchJson('/trpc/curriculum.plans.upsert', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function logCurriculumAssignment(input: { plan_id: string; day: number; type:'activity'|'scenario'; ref: string; status?: 'pending'|'done'|'skipped'; feedback?: string }): Promise<{ _id: string }> {
  return fetchJson('/trpc/curriculum.assignments.log', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

// Users
export async function getUserProfile(): Promise<UserProfile> {
  return fetchJson('/trpc/users.profile.get');
}
export async function upsertUserProfile(input: Partial<UserProfile>): Promise<UserProfile> {
  return fetchJson('/trpc/users.profile.upsert', { method: 'POST', body: JSON.stringify({ input }) });
}
export async function getUserSettings(): Promise<UserSettings> {
  return fetchJson('/trpc/users.settings.get');
}
export async function upsertUserSettings(input: Partial<UserSettings>): Promise<UserSettings> {
  return fetchJson('/trpc/users.settings.upsert', { method: 'POST', body: JSON.stringify({ input }) });
}
export async function listUserDevices(): Promise<{ items: UserDevice[] }> {
  return fetchJson('/trpc/users.devices.list');
}
export async function upsertUserDevice(input: Partial<UserDevice>): Promise<UserDevice> {
  return fetchJson('/trpc/users.devices.upsert', { method: 'POST', body: JSON.stringify({ input }) });
}

export async function listUsers(limit = 100): Promise<{ items: Array<{ _id: string; display_name?: string; locale?: string; avatar_url?: string; updated_at?: string }> }> {
  return fetchJson(`/trpc/users.list?limit=${encodeURIComponent(String(limit))}`)
}

// Storage
export async function storagePresign(input: { key?: string; contentType?: string; bucket?: string }): Promise<{ uploadUrl?: string; url?: string; publicUrl?: string; key?: string }> {
  return fetchJson('/trpc/storage.presign', { method: 'POST', body: JSON.stringify({ input }) })
}

// AI
export async function aiReplyGenerate(input: { text?: string; sessionId?: string; style?: 'short'|'normal'; locale?: 'ko'|'en' }): Promise<{ text: string; safety?: { flagged: boolean; reason?: string } }> {
  return fetchJson('/trpc/ai.reply.generate', { method: 'POST', body: JSON.stringify({ input }) })
}

export async function aiOrchestratorChat(input: { sessionId: string; text: string; asUserId?: string }): Promise<{ text: string; intent: any; state: any; traceId: string }> {
  return fetchJson('/trpc/ai.orchestrator.chat', { method: 'POST', body: JSON.stringify({ input }) })
}

export async function listSessions(userId: string, limit = 20): Promise<{ items: any[] }> {
  const p = new URLSearchParams();
  if (userId) p.set('userId', userId);
  p.set('limit', String(limit));
  return fetchJson(`/trpc/sessions.list?${p.toString()}`)
}

export async function ensureSession(userId: string): Promise<{ _id: string }> {
  return fetchJson('/trpc/sessions.ensure', { method: 'POST', body: JSON.stringify({ input: { userId } }) })
}
export async function listDialogueTurns(sessionId: string, limit = 100): Promise<{ items: any[] }> {
  const p = new URLSearchParams();
  p.set('sessionId', sessionId);
  p.set('limit', String(limit));
  return fetchJson(`/trpc/dialogue.turns.list?${p.toString()}`)
}
export async function getSessionSummary(sessionId: string): Promise<any> {
  const p = new URLSearchParams();
  p.set('sessionId', sessionId);
  return fetchJson(`/trpc/summaries.session.get?${p.toString()}`)
}

// Assets3D
export async function listAssets3D(): Promise<{ items: Asset3D[] }> {
  return fetchJson('/trpc/assets3d.assets.list')
}
export async function upsertAsset3D(input: Partial<Asset3D>): Promise<Asset3D> {
  return fetchJson('/trpc/assets3d.assets.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function listScenes3D(): Promise<{ items: Scene3D[] }> {
  return fetchJson('/trpc/assets3d.scenes.list')
}
export async function upsertScene3D(input: Partial<Scene3D>): Promise<Scene3D> {
  return fetchJson('/trpc/assets3d.scenes.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function listAnims3D(): Promise<{ items: Anim3D[] }> {
  return fetchJson('/trpc/assets3d.anims.list')
}
export async function upsertAnim3D(input: Partial<Anim3D>): Promise<Anim3D> {
  return fetchJson('/trpc/assets3d.anims.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}

// Env/BGM
export type EnvPreset = { _id?: string; name?: string; timePhase?: 'dawn'|'day'|'dusk'|'night'; weather?: 'clear'|'cloudy'|'rain'|'snow'; light?: any; fog?: any; particles?: any; post?: any }
export type Track = { _id: string; title: string; composer: string; uri: string; duration_sec: number; tags: any }

export async function envGetPreset(input: { time?: string; weather?: 'clear'|'cloudy'|'rain'|'snow'; state?: { need?: 'calm'|'sleep'|'focus'|'mood_lift'|'grounding'; regulation?: 'downregulate'|'stabilize'|'upregulate' } }): Promise<EnvPreset> {
  return fetchJson('/trpc/env.getPreset', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function bgmPick(input: { policy: { need: 'calm'|'sleep'|'focus'|'mood_lift'|'grounding', timePhase: 'dawn'|'day'|'dusk'|'night', weather: 'clear'|'cloudy'|'rain'|'snow', regulation?: 'downregulate'|'stabilize'|'upregulate' }, constraints?: { max_energy?: number } }): Promise<{ trackId: string }> {
  return fetchJson('/trpc/bgm.tracks.pick', { method: 'POST', body: JSON.stringify({ input }) })
}

// Bible / Knowledge
export type BibleUnit = { _id?: string; title: string; version?: string; content?: any; updated_at?: string }
export type KnowledgePack = { _id?: string; bible_version?: string; version?: string; summary?: any; updated_at?: string }

export async function listBibleUnits(): Promise<{ items: BibleUnit[] }> {
  return fetchJson('/trpc/bible.units.list')
}
export async function upsertBibleUnit(input: Partial<BibleUnit>): Promise<BibleUnit> {
  return fetchJson('/trpc/bible.units.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function listKnowledgePacks(): Promise<{ items: KnowledgePack[] }> {
  return fetchJson('/trpc/knowledge.packs.list')
}
export async function upsertKnowledgePack(input: Partial<KnowledgePack>): Promise<KnowledgePack> {
  return fetchJson('/trpc/knowledge.packs.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}

// Bible Rules
export type BibleRule = { _id?: string; rule_text: string; category?: string; status?: 'draft'|'active'|'archived'; source?: string; tags?: string[]; updated_at?: string };
export async function listBibleRules(params?: { q?: string; status?: string; category?: string; source?: string; limit?: number }): Promise<{ items: BibleRule[] }> {
  const p = new URLSearchParams();
  if (params?.q) p.set('q', params.q);
  if (params?.status) p.set('status', params.status);
  if (params?.category) p.set('category', params.category);
  if (params?.source) p.set('source', params.source);
  if (params?.limit) p.set('limit', String(params.limit));
  return fetchJson(`/trpc/bible.rules.list?${p.toString()}`)
}
export async function upsertBibleRule(input: Partial<BibleRule> & { _id?: string }): Promise<{ _id: string }> {
  return fetchJson('/trpc/bible.rules.upsert', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function archiveBibleRule(input: { ruleId: string; reason?: string }): Promise<{ ok: true }> {
  return fetchJson('/trpc/bible.rules.archive', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function promoteBibleRule(input: { ruleId: string; notes?: string }): Promise<{ ok: true }> {
  return fetchJson('/trpc/bible.rules.promote', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function listBibleRuleChanges(params?: { ruleId?: string; limit?: number }): Promise<{ items: any[] }> {
  const p = new URLSearchParams();
  if (params?.ruleId) p.set('ruleId', params.ruleId);
  if (params?.limit) p.set('limit', String(params.limit));
  return fetchJson(`/trpc/bible.rules.changes.list?${p.toString()}`)
}

export async function proposeRuleFromDialogue(input: { sessionId?: string; userId?: string; limit?: number }): Promise<{ ok: boolean; proposal: any; traceId: string }> {
  return fetchJson('/trpc/bible.rules.proposeFromDialogue', { method: 'POST', body: JSON.stringify({ input }) })
}

// MAGI / AI master
export async function aiPerceptionSummarize(input: any): Promise<any> {
  return fetchJson('/trpc/ai.perception.summarize', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function aiDirectorDecideActions(input: any): Promise<any> {
  return fetchJson('/trpc/ai.director.decideActions', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function aiMasterPropose(input: any): Promise<any> {
  return fetchJson('/trpc/ai.master.propose', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function aiMasterValidate(input: any): Promise<any> {
  return fetchJson('/trpc/ai.master.validate', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function aiMasterShadowTest(input: any): Promise<any> {
  return fetchJson('/trpc/ai.master.shadowTest', { method: 'POST', body: JSON.stringify({ input }) })
}
export async function aiMasterPromote(input: any): Promise<any> {
  return fetchJson('/trpc/ai.master.promote', { method: 'POST', body: JSON.stringify({ input }) })
}
