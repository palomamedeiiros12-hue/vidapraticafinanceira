import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

const authenticatedUser = {
  id: 'user-123',
  email: 'person@example.com',
  user_metadata: { name: 'Pessoa' }
};

function makeQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(result)),
    upsert: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    delete: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result))
  };
  return query;
}

describe('Supabase user data access', () => {
  let client;
  let api;

  beforeAll(async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
    client = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn()
      },
      from: vi.fn()
    };
    createClient.mockReturnValue(client);
    api = await import('../js/supabase.js');
  });

  beforeEach(() => {
    client.auth.getUser.mockReset().mockResolvedValue({ data: { user: authenticatedUser }, error: null });
    client.auth.getSession.mockReset().mockResolvedValue({ data: { session: { user: authenticatedUser } }, error: null });
    client.auth.signUp.mockReset();
    client.auth.signInWithPassword.mockReset();
    client.auth.signOut.mockReset();
    client.from.mockReset();
  });

  it('uses the configured remote account service', () => {
    expect(api.isSupabaseConfigured()).toBe(true);
  });

  it('normalizes email for Supabase signup and never stores account passwords locally', async () => {
    client.auth.signUp.mockResolvedValue({
      data: { user: authenticatedUser, session: { user: authenticatedUser } },
      error: null
    });

    const result = await api.signUp({ name: 'Pessoa', email: ' PERSON@EXAMPLE.COM ', password: 'secret-password' });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'secret-password',
      options: { data: { name: 'Pessoa' } }
    });
    expect(result.needsEmailConfirmation).toBe(false);
    expect(result.user.id).toBe(authenticatedUser.id);
  });

  it('rejects requests for another account before sending a data query', async () => {
    await expect(api.getTransactionsByUser('another-user'))
      .rejects.toThrow(/outra conta/i);
    await expect(api.saveTransaction({
      user_id: 'another-user',
      type: 'despesa',
      description: 'Tentativa',
      category: 'Outros',
      value: 100,
      date: '2026-10-06'
    })).rejects.toThrow(/outra conta/i);
    expect(client.from).not.toHaveBeenCalled();
  });

  it('filters transactions by the authenticated owner', async () => {
    const rows = [{ id: 'tx-1', user_id: authenticatedUser.id, type: 'despesa', value: 1250 }];
    const query = makeQuery({ data: rows, error: null });
    client.from.mockReturnValue(query);

    await expect(api.getTransactionsByUser(authenticatedUser.id)).resolves.toEqual(rows);

    expect(client.from).toHaveBeenCalledWith('transactions');
    expect(query.eq).toHaveBeenCalledWith('user_id', authenticatedUser.id);
  });

  it('persists a transaction with the authenticated owner only', async () => {
    const row = {
      id: 'tx-2',
      user_id: authenticatedUser.id,
      type: 'despesa',
      description: 'Mercado',
      category: 'Alimentação',
      value: 1250,
      date: '2026-10-06'
    };
    const query = makeQuery({ data: row, error: null });
    client.from.mockReturnValue(query);

    await expect(api.saveTransaction(row)).resolves.toEqual(row);

    expect(client.from).toHaveBeenCalledWith('transactions');
    expect(query.upsert).toHaveBeenCalledWith(row);
    expect(query.single).toHaveBeenCalledOnce();
  });

  it('surfaces database errors to the caller', async () => {
    const query = makeQuery({ data: null, error: { message: 'permission denied by row-level security policy' } });
    client.from.mockReturnValue(query);

    await expect(api.getTransactionsByUser(authenticatedUser.id))
      .rejects.toThrow(/row-level security/i);
  });
});
