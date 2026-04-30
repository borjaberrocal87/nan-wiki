import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiFetch,
  fetchLinks,
  fetchLinkById,
  fetchSources,
  fetchAuthors,
  fetchChannels,
  fetchTags,
  exchangeDiscordToken,
  apiLogout,
  fetchAuthMe,
  fetchStats,
  sendChatMessage,
  searchLinks,
} from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends request with credentials and json headers', async () => {
    const mockJson = { id: '1', name: 'test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJson),
    });

    await apiFetch('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('includes custom headers and method', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch('/api/test', { method: 'POST', body: JSON.stringify({ data: 'value' }) });

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ data: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('throws Error on non-ok response with json detail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not found' }),
    });

    await expect(apiFetch('/api/test')).rejects.toThrow('Not found');
  });

  it('throws Error on non-ok response with fallback detail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Not JSON')),
    });

    await expect(apiFetch('/api/test')).rejects.toThrow('Request failed');
  });

  it('returns parsed json on success', async () => {
    const mockData = { id: '42', title: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await apiFetch('/api/test');
    expect(result).toEqual(mockData);
  });
});

describe('fetchLinks', () => {
  it('builds query params from object', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    await fetchLinks({ source_id: 'github', page: 2, per_page: 10 });

    expect(fetch).toHaveBeenCalledWith(
      '/api/links?source_id=github&page=2&per_page=10',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('omits undefined and null params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    await fetchLinks({ source_id: 'github', tag_ids: undefined, page: 1, per_page: 20 });

    const calledUrl = (fetch as any).mock.calls[0][0];
    expect(calledUrl).not.toContain('tag_ids');
  });

  it('fetches without params when object is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    await fetchLinks();
    expect(fetch).toHaveBeenCalledWith('/api/links', expect.any(Object));
  });
});

describe('fetchLinkById', () => {
  it('fetches single link by id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'abc123', title: 'Test' } }),
    });

    await fetchLinkById('abc123');
    expect(fetch).toHaveBeenCalledWith('/api/links/abc123', expect.any(Object));
  });
});

describe('fetchSources', () => {
  it('fetches sources list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'github', name: 'GitHub' }] }),
    });

    await fetchSources();
    expect(fetch).toHaveBeenCalledWith('/api/links/sources', expect.any(Object));
  });
});

describe('fetchAuthors', () => {
  it('fetches authors list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchAuthors();
    expect(fetch).toHaveBeenCalledWith('/api/links/authors', expect.any(Object));
  });
});

describe('fetchChannels', () => {
  it('fetches channels list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchChannels();
    expect(fetch).toHaveBeenCalledWith('/api/links/channels', expect.any(Object));
  });
});

describe('fetchTags', () => {
  it('fetches tags list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchTags();
    expect(fetch).toHaveBeenCalledWith('/api/links/tags', expect.any(Object));
  });
});

describe('exchangeDiscordToken', () => {
  it('sends code and state to callback endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-token-here' }),
    });

    const result = await exchangeDiscordToken('auth-code', 'state-value');
    expect(result).toEqual({ token: 'jwt-token-here' });
    expect(fetch).toHaveBeenCalledWith('/api/auth/discord/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'auth-code', state: 'state-value' }),
    });
  });

  it('throws on failed exchange', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    await expect(exchangeDiscordToken('bad-code', 'bad-state')).rejects.toThrow('Failed to exchange token');
  });
});

describe('apiLogout', () => {
  it('posts to logout endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await apiLogout();
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });
});

describe('fetchAuthMe', () => {
  it('fetches current user info', async () => {
    const mockUser = {
      discordId: '123456',
      username: 'testuser',
      isAdmin: false,
      namespace: 'default',
      role: 'user',
      roles: ['user'],
      expiresAt: '2025-12-31T23:59:59Z',
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const result = await fetchAuthMe();
    expect(result).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
  });
});

describe('fetchStats', () => {
  it('fetches dashboard stats', async () => {
    const mockStats = {
      totalLinks: 100,
      linksToday: 5,
      linksThisWeek: 30,
      totalAuthors: 10,
      userLinkCount: 3,
      contributionPercent: 3,
      topAuthors: [{ username: 'user1', linkCount: 20 }],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const result = await fetchStats();
    expect(result).toEqual(mockStats);
  });
});

describe('sendChatMessage', () => {
  it('sends message to chat endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Hello!' }),
    });

    const result = await sendChatMessage('Hi there');
    expect(result).toEqual({ message: 'Hello!' });
    expect(fetch).toHaveBeenCalledWith('/api/chat/message', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi there' }),
    });
  });

  it('throws on failed chat request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'LLM error' }),
    });

    await expect(sendChatMessage('test')).rejects.toThrow('LLM error');
  });
});

describe('searchLinks', () => {
  it('searches with type and params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    await searchLinks('test query', 'text', undefined, 1, 20);
    expect(fetch).toHaveBeenCalledWith(
      '/api/links/search?q=test+query&type=text&page=1&per_page=20',
      expect.any(Object)
    );
  });

  it('includes embedding param when provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    await searchLinks('test', 'hybrid', '[0.1, 0.2, 0.3]', 1, 10);
    const calledUrl = (fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=test');
    expect(calledUrl).toContain('type=hybrid');
    expect(calledUrl).toContain('embedding=%5B0.1%2C+0.2%2C+0.3%5D');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('per_page=10');
  });
});
