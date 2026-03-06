// ---------------------------------------------------------------------------
// Supabase Direct API — Pure Functions
//
// Model-agnostic infrastructure operations. No AI model in the loop.
// These functions call Supabase REST API (PostgREST) directly via fetch().
// No IPC, no Electron dependencies — fully testable with mocked fetch.
//
// The IPC handlers in main.ts are thin wrappers that call these functions.
// MCP tools (brain_create_profile, brain_update_profile, brain_export) remain
// intact for the AI-assisted path. Both coexist.
//
// See: BUILD_SPECS/Direct_Profile_API_Spec.md
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  timeoutMs: number;
}

export interface CreateProfileResult {
  id: string;
  slug: string;
  display_name: string;
  first_name: string;
}

export interface UpdateProfileResult {
  updated: boolean;
  fields: string[];
}

export interface BrainExportData {
  version: string;
  exported_at: string;
  user: Record<string, unknown>;
  metadata: {
    total_memories: number;
    stores: number;
    categories: string[];
    export_source: string;
    incomplete_stores: string[];
  };
  episodic: Record<string, unknown>[];
  graph: { nodes: never[]; edges: never[]; note: string };
  semantic: never[];
  associative: never[];
  coaching_sessions: Record<string, unknown>[];
}

// Fields that can be written to user_profiles via update.
// Must match brain_update_profile ALLOWED_FIELDS in server.py (lines 97-104).
const ALLOWED_PROFILE_FIELDS = new Set([
  'roles', 'focus_area', 'coaching_style', 'declared_challenges',
  'is_business_owner', 'side_hustle_goal',
  'business_description', 'business_stage',
  'current_business_focus', 'business_challenges',
  'career_situation', 'career_stage',
  'career_focus', 'career_challenges',
  'love_partner_situation', 'onboarding_completed',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function headers(anonKey: string, contentType = true): Record<string, string> {
  const h: Record<string, string> = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };
  if (contentType) {
    h['Content-Type'] = 'application/json';
    h['Prefer'] = 'return=representation';
  }
  return h;
}

// ---------------------------------------------------------------------------
// createProfileDirect
// ---------------------------------------------------------------------------

export async function createProfileDirect(
  config: SupabaseConfig,
  displayName: string,
): Promise<CreateProfileResult> {
  const trimmed = displayName.trim();
  if (!trimmed) {
    throw new Error('Display name cannot be empty');
  }

  const parts = trimmed.split(/\s+/);
  const firstName = parts[0];
  const slug = firstName.toLowerCase();

  const userData = {
    display_name: trimmed,
    first_name: firstName,
    slug,
    coaching_style: 'balanced',
    is_demo_user: false,
    onboarding_completed: false,
  };

  const response = await fetch(`${config.url}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: headers(config.anonKey),
    body: JSON.stringify(userData),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile creation failed: ${response.status} ${error}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Profile creation returned no data');
  }

  const created = rows[0];
  return {
    id: created.id,
    slug,
    display_name: created.display_name,
    first_name: created.first_name,
  };
}

// ---------------------------------------------------------------------------
// updateProfileDirect
// ---------------------------------------------------------------------------

export async function updateProfileDirect(
  config: SupabaseConfig,
  userId: string,
  profileData: Record<string, unknown>,
): Promise<UpdateProfileResult> {
  // Whitelist validation — same fields as brain_update_profile in server.py
  const safeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profileData)) {
    if (ALLOWED_PROFILE_FIELDS.has(key)) {
      safeData[key] = value;
    }
  }

  const response = await fetch(
    `${config.url}/rest/v1/user_profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: headers(config.anonKey),
      body: JSON.stringify(safeData),
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile update failed: ${response.status} ${error}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Profile update: no user found with id ${userId}`);
  }

  return { updated: true, fields: Object.keys(safeData) };
}

// ---------------------------------------------------------------------------
// exportDataDirect
// ---------------------------------------------------------------------------

export async function exportDataDirect(
  config: SupabaseConfig,
  userId: string,
): Promise<BrainExportData> {
  const h = headers(config.anonKey, false);
  const signal = AbortSignal.timeout(config.timeoutMs);

  // Parallel fetch from Supabase — same tables as export_pipeline.py
  const [profileRes, memoriesRes, sessionsRes] = await Promise.all([
    fetch(`${config.url}/rest/v1/user_profiles?id=eq.${userId}&select=*`, { headers: h, signal }),
    fetch(`${config.url}/rest/v1/memories?user_id=eq.${userId}&select=*&order=created_at.desc`, { headers: h, signal }),
    fetch(`${config.url}/rest/v1/coaching_sessions?user_id=eq.${userId}&select=*&order=created_at.desc`, { headers: h, signal }),
  ]);

  // Validate responses before parsing
  if (!profileRes.ok) throw new Error(`Export: profile fetch failed (${profileRes.status})`);
  if (!memoriesRes.ok) throw new Error(`Export: memories fetch failed (${memoriesRes.status})`);
  if (!sessionsRes.ok) throw new Error(`Export: sessions fetch failed (${sessionsRes.status})`);

  const [profiles, memories, sessions] = await Promise.all([
    profileRes.json() as Promise<Record<string, unknown>[]>,
    memoriesRes.json() as Promise<Record<string, unknown>[]>,
    sessionsRes.json() as Promise<Record<string, unknown>[]>,
  ]);

  const profile = profiles[0] || {};

  // Filter memories with confidence >= 0.3 (same as export_pipeline.py line 53)
  const filtered = memories.filter((m) =>
    ((m.confidence as number) ?? 0.7) >= 0.3,
  );

  const categories = [...new Set(
    filtered.map((m) => m.category as string).filter(Boolean),
  )];

  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    user: profile,
    metadata: {
      total_memories: filtered.length,
      stores: 4,
      categories,
      export_source: 'direct_api',
      incomplete_stores: ['neo4j', 'mem0', 'qdrant'],
    },
    episodic: filtered,
    graph: { nodes: [], edges: [], note: 'Graph data available via Brain Cloud MCP tools' },
    semantic: [],
    associative: [],
    coaching_sessions: sessions,
  };
}
