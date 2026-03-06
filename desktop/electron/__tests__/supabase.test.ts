import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProfileDirect,
  updateProfileDirect,
  getProfileDirect,
  exportDataDirect,
  type SupabaseConfig,
} from '../supabase';

// ---------------------------------------------------------------------------
// Test config — no real Supabase calls, all fetch is mocked
// ---------------------------------------------------------------------------

const config: SupabaseConfig = {
  url: 'https://test-project.supabase.co',
  anonKey: 'test-anon-key',
  timeoutMs: 5000,
};

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper: build a successful Response
function okResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper: build an error Response
function errorResponse(status: number, message: string): Response {
  return new Response(message, { status });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ===========================================================================
// createProfileDirect
// ===========================================================================

describe('createProfileDirect', () => {
  it('creates a profile and returns id, slug, display_name, first_name', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{
        id: 'uuid-123',
        display_name: 'Alex Rivera',
        first_name: 'Alex',
      }]),
    );

    const result = await createProfileDirect(config, 'Alex Rivera');

    expect(result).toEqual({
      id: 'uuid-123',
      slug: 'alex',
      display_name: 'Alex Rivera',
      first_name: 'Alex',
    });

    // Verify the fetch call
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://test-project.supabase.co/rest/v1/user_profiles');
    expect(opts.method).toBe('POST');
    expect(opts.headers.apikey).toBe('test-anon-key');
    expect(opts.headers['Prefer']).toBe('return=representation');

    const body = JSON.parse(opts.body);
    expect(body.display_name).toBe('Alex Rivera');
    expect(body.first_name).toBe('Alex');
    expect(body.coaching_style).toBe('balanced');
    expect(body.is_demo_user).toBe(false);
    expect(body.onboarding_completed).toBe(false);
  });

  it('derives slug from first word, lowercased', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-1', display_name: 'Theo Nakamura', first_name: 'Theo' }]),
    );

    const result = await createProfileDirect(config, 'Theo Nakamura');
    expect(result.slug).toBe('theo');
  });

  it('handles single-word names', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-2', display_name: 'Madonna', first_name: 'Madonna' }]),
    );

    const result = await createProfileDirect(config, 'Madonna');
    expect(result.slug).toBe('madonna');
  });

  it('trims whitespace from display name', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-3', display_name: 'Alex Rivera', first_name: 'Alex' }]),
    );

    await createProfileDirect(config, '  Alex Rivera  ');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.display_name).toBe('Alex Rivera');
  });

  it('throws on empty display name', async () => {
    await expect(createProfileDirect(config, '')).rejects.toThrow('Display name cannot be empty');
    await expect(createProfileDirect(config, '   ')).rejects.toThrow('Display name cannot be empty');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws on Supabase 400 error', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, 'Bad request'));

    await expect(createProfileDirect(config, 'Alex')).rejects.toThrow(
      'Profile creation failed: 400',
    );
  });

  it('throws on Supabase 500 error', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(500, 'Internal server error'));

    await expect(createProfileDirect(config, 'Alex')).rejects.toThrow(
      'Profile creation failed: 500',
    );
  });

  it('throws if Supabase returns empty array', async () => {
    mockFetch.mockResolvedValueOnce(okResponse([]));

    await expect(createProfileDirect(config, 'Alex')).rejects.toThrow(
      'Profile creation returned no data',
    );
  });
});

// ===========================================================================
// updateProfileDirect
// ===========================================================================

describe('updateProfileDirect', () => {
  it('updates allowed fields and returns success', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-123', roles: ['founder'], focus_area: 'career-business' }]),
    );

    const result = await updateProfileDirect(config, 'uuid-123', {
      roles: ['founder'],
      focus_area: 'career-business',
      onboarding_completed: true,
    });

    expect(result.updated).toBe(true);
    expect(result.fields).toContain('roles');
    expect(result.fields).toContain('focus_area');
    expect(result.fields).toContain('onboarding_completed');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://test-project.supabase.co/rest/v1/user_profiles?id=eq.uuid-123');
    expect(opts.method).toBe('PATCH');
  });

  it('strips disallowed fields silently', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-123' }]),
    );

    await updateProfileDirect(config, 'uuid-123', {
      roles: ['founder'],
      is_admin: true,             // NOT in whitelist
      secret_field: 'hacked',     // NOT in whitelist
      focus_area: 'health',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.roles).toEqual(['founder']);
    expect(body.focus_area).toBe('health');
    expect(body).not.toHaveProperty('is_admin');
    expect(body).not.toHaveProperty('secret_field');
  });

  it('sends all whitelisted fields correctly', async () => {
    mockFetch.mockResolvedValueOnce(okResponse([{ id: 'uuid-123' }]));

    const allFields = {
      roles: ['freelancer'],
      focus_area: 'personal-growth',
      coaching_style: 'direct',
      declared_challenges: ['perfectionism'],
      is_business_owner: false,
      side_hustle_goal: 'test',
      business_description: 'test',
      business_stage: 'building',
      current_business_focus: 'test',
      business_challenges: ['time'],
      career_situation: 'employed',
      career_stage: 'mid',
      career_focus: 'test',
      career_challenges: ['growth'],
      love_partner_situation: 'single',
      onboarding_completed: true,
    };

    const result = await updateProfileDirect(config, 'uuid-123', allFields);
    expect(result.fields).toHaveLength(16);
  });

  it('throws on Supabase 400 error', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, 'Bad request'));

    await expect(
      updateProfileDirect(config, 'uuid-123', { roles: ['founder'] }),
    ).rejects.toThrow('Profile update failed: 400');
  });

  it('throws if user not found (empty response)', async () => {
    mockFetch.mockResolvedValueOnce(okResponse([]));

    await expect(
      updateProfileDirect(config, 'nonexistent-uuid', { roles: ['founder'] }),
    ).rejects.toThrow('no user found with id nonexistent-uuid');
  });
});

// ===========================================================================
// getProfileDirect
// ===========================================================================

describe('getProfileDirect', () => {
  it('fetches a user profile by UUID', async () => {
    const profile = {
      id: 'uuid-123',
      display_name: 'Test User',
      goal_cascade: { vision: 'test vision', next_action_step: 'do something' },
    };
    mockFetch.mockResolvedValueOnce(okResponse([profile]));

    const result = await getProfileDirect(config, 'uuid-123');
    expect(result.display_name).toBe('Test User');
    expect(result.goal_cascade).toEqual({
      vision: 'test vision',
      next_action_step: 'do something',
    });
  });

  it('returns profile with null goal_cascade when not yet completed', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse([{ id: 'uuid-456', display_name: 'New User', goal_cascade: null }]),
    );

    const result = await getProfileDirect(config, 'uuid-456');
    expect(result.goal_cascade).toBeNull();
  });

  it('throws when user not found', async () => {
    mockFetch.mockResolvedValueOnce(okResponse([]));
    await expect(getProfileDirect(config, 'nonexistent')).rejects.toThrow(
      'No user found with id nonexistent',
    );
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('server error', { status: 500 }),
    );
    await expect(getProfileDirect(config, 'uuid')).rejects.toThrow(
      'Profile fetch failed: 500',
    );
  });
});

// ===========================================================================
// exportDataDirect
// ===========================================================================

describe('exportDataDirect', () => {
  it('assembles export from parallel Supabase queries', async () => {
    const profile = { id: 'uuid-123', display_name: 'Alex', roles: ['founder'] };
    const memories = [
      { memory_id: 'm1', content: 'test', category: 'goal', confidence: 0.8 },
      { memory_id: 'm2', content: 'test2', category: 'insight', confidence: 0.5 },
    ];
    const sessions = [{ id: 's1', status: 'completed' }];

    mockFetch
      .mockResolvedValueOnce(okResponse([profile]))
      .mockResolvedValueOnce(okResponse(memories))
      .mockResolvedValueOnce(okResponse(sessions));

    const result = await exportDataDirect(config, 'uuid-123');

    expect(result.version).toBe('1.0');
    expect(result.exported_at).toBeTruthy();
    expect(result.user).toEqual(profile);
    expect(result.episodic).toHaveLength(2);
    expect(result.coaching_sessions).toHaveLength(1);
    expect(result.metadata.total_memories).toBe(2);
    expect(result.metadata.export_source).toBe('direct_api');
    expect(result.metadata.incomplete_stores).toEqual(['neo4j', 'mem0', 'qdrant']);
    expect(result.metadata.categories).toEqual(expect.arrayContaining(['goal', 'insight']));
    expect(result.graph.note).toContain('Brain Cloud MCP tools');
    expect(result.semantic).toEqual([]);
    expect(result.associative).toEqual([]);
  });

  it('filters memories with confidence < 0.3', async () => {
    const memories = [
      { memory_id: 'm1', content: 'keep', category: 'goal', confidence: 0.8 },
      { memory_id: 'm2', content: 'filter', category: 'goal', confidence: 0.2 },
      { memory_id: 'm3', content: 'filter', category: 'goal', confidence: 0.1 },
    ];

    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid' }]))
      .mockResolvedValueOnce(okResponse(memories))
      .mockResolvedValueOnce(okResponse([]));

    const result = await exportDataDirect(config, 'uuid');
    expect(result.episodic).toHaveLength(1);
    expect(result.metadata.total_memories).toBe(1);
  });

  it('includes memories with null confidence (default 0.7 >= 0.3)', async () => {
    const memories = [
      { memory_id: 'm1', content: 'keep', category: 'goal', confidence: null },
      { memory_id: 'm2', content: 'keep', category: 'insight' },  // no confidence field
    ];

    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid' }]))
      .mockResolvedValueOnce(okResponse(memories))
      .mockResolvedValueOnce(okResponse([]));

    const result = await exportDataDirect(config, 'uuid');
    expect(result.episodic).toHaveLength(2);
  });

  it('handles empty user (no memories, no sessions)', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid', display_name: 'New User' }]))
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(okResponse([]));

    const result = await exportDataDirect(config, 'uuid');
    expect(result.episodic).toEqual([]);
    expect(result.coaching_sessions).toEqual([]);
    expect(result.metadata.total_memories).toBe(0);
    expect(result.metadata.categories).toEqual([]);
  });

  it('throws if profile fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse(500, 'DB error'))
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(okResponse([]));

    await expect(exportDataDirect(config, 'uuid')).rejects.toThrow(
      'Export: profile fetch failed (500)',
    );
  });

  it('throws if memories fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid' }]))
      .mockResolvedValueOnce(errorResponse(500, 'DB error'))
      .mockResolvedValueOnce(okResponse([]));

    await expect(exportDataDirect(config, 'uuid')).rejects.toThrow(
      'Export: memories fetch failed (500)',
    );
  });

  it('throws if sessions fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid' }]))
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(errorResponse(500, 'DB error'));

    await expect(exportDataDirect(config, 'uuid')).rejects.toThrow(
      'Export: sessions fetch failed (500)',
    );
  });

  it('makes 3 parallel fetch calls with correct URLs', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse([{ id: 'uuid-456' }]))
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(okResponse([]));

    await exportDataDirect(config, 'uuid-456');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls[0]).toContain('user_profiles?id=eq.uuid-456');
    expect(urls[1]).toContain('memories?user_id=eq.uuid-456');
    expect(urls[2]).toContain('coaching_sessions?user_id=eq.uuid-456');
  });
});
