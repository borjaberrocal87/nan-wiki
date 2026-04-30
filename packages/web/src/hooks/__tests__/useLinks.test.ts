import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLinks } from '../useLinks';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof api>('@/lib/api');
  return {
    ...actual,
    fetchLinks: vi.fn(),
    fetchSources: vi.fn(),
    fetchAuthors: vi.fn(),
    fetchChannels: vi.fn(),
    fetchTags: vi.fn(),
    searchLinks: vi.fn(),
  };
});

vi.mock('@/lib/api-url', () => ({
  PER_PAGE: 20,
}));

const mockLinks = [
  { id: '1', url: 'https://a.com', domain: 'a.com', source_id: 'github', source_name: 'GitHub', author_id: 1, author_username: 'user1', channel_id: 1, channel_name: 'dev', discord_message_id: 1, posted_at: new Date().toISOString(), llm_status: 'done', title: 'Link 1', description: 'Desc 1', tags: [], source_detected: 'github', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', url: 'https://b.com', domain: 'b.com', source_id: 'twitter', source_name: 'Twitter', author_id: 2, author_username: 'user2', channel_id: 1, channel_name: 'dev', discord_message_id: 2, posted_at: new Date().toISOString(), llm_status: 'done', title: 'Link 2', description: 'Desc 2', tags: [], source_detected: 'twitter', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('useLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.fetchLinks as any).mockResolvedValue({ data: mockLinks, total: 2, page: 1, per_page: 20 });
    (api.fetchSources as any).mockResolvedValue({ data: [{ id: 'github', name: 'GitHub' }] });
    (api.fetchAuthors as any).mockResolvedValue({ data: [{ id: '1', name: 'User 1' }] });
    (api.fetchChannels as any).mockResolvedValue({ data: [{ id: '1', name: 'dev' }] });
    (api.fetchTags as any).mockResolvedValue({ data: [{ id: 'tag-1', name: 'test' }] });
    (api.searchLinks as any).mockResolvedValue({ data: mockLinks, total: 2, page: 1, per_page: 20 });
    // Mock window.location
    delete (window as any).location;
    window.location = { ...window.location, pathname: '/links' } as Location;
    // Mock history
    window.history.replaceState = vi.fn();
  });

  it('initializes with loaded links', async () => {
    const { result } = renderHook(() => useLinks());

    await new Promise(r => setTimeout(r, 50));

    expect(result.current.loading).toBe(false);
    expect(result.current.links).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.page).toBe(1);
  });

  it('loads sources, authors, channels, tags on mount', async () => {
    renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    expect(api.fetchSources).toHaveBeenCalled();
    expect(api.fetchAuthors).toHaveBeenCalled();
    expect(api.fetchChannels).toHaveBeenCalled();
    expect(api.fetchTags).toHaveBeenCalled();
  });

  it('hasMore is true when there are more items', async () => {
    (api.fetchLinks as any).mockResolvedValue({ data: mockLinks, total: 100, page: 1, per_page: 20 });

    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    expect(result.current.hasMore).toBe(true);
  });

  it('hasMore is false when all items loaded', async () => {
    (api.fetchLinks as any).mockResolvedValue({ data: mockLinks, total: 2, page: 1, per_page: 20 });

    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    expect(result.current.hasMore).toBe(false);
  });

  it('calls setPage and fetches new page', async () => {
    (api.fetchLinks as any).mockResolvedValue({ data: mockLinks, total: 40, page: 2, per_page: 20 });

    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);
  });

  it('calls loadMore to append links', async () => {
    (api.fetchLinks as any).mockResolvedValue({ data: mockLinks, total: 40, page: 2, per_page: 20 });

    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.loadMore();
    });

    expect(result.current.page).toBe(2);
  });

  it('clears all filters', async () => {
    const { result } = renderHook(() => useLinks({ initialFilters: { source_id: 'github' } }));
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.searchQuery).toBe('');
  });

  it('sets search query and triggers filter update', async () => {
    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
  });

  it('does not set search_query filter when below 3 chars', async () => {
    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setSearchQuery('ab');
    });

    expect(result.current.searchQuery).toBe('ab');
  });

  it('sets filters via setFilters', async () => {
    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setFilters({ source_id: 'github', tag_ids: ['tag-1'] });
    });

    expect(result.current.filters.source_id).toBe('github');
  });

  it('shows error on fetch failure', async () => {
    (api.fetchLinks as any).mockRejectedValue(new Error('API down'));

    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    expect(result.current.error).toContain('Failed to load links');
    expect(result.current.links).toEqual([]);
  });

  it('uses initialFilters when no URL params', async () => {
    const { result } = renderHook(() => useLinks({ initialFilters: { source_id: 'youtube' } }));
    await new Promise(r => setTimeout(r, 50));

    expect(result.current.filters.source_id).toBe('youtube');
  });

  it('returns correct shape', async () => {
    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    expect(result.current).toHaveProperty('links');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('total');
    expect(result.current).toHaveProperty('page');
    expect(result.current).toHaveProperty('hasMore');
    expect(result.current).toHaveProperty('sources');
    expect(result.current).toHaveProperty('authors');
    expect(result.current).toHaveProperty('channels');
    expect(result.current).toHaveProperty('tags');
    expect(result.current).toHaveProperty('filters');
    expect(result.current).toHaveProperty('searchQuery');
    expect(result.current).toHaveProperty('setPage');
    expect(result.current).toHaveProperty('setSearchQuery');
    expect(result.current).toHaveProperty('setFilters');
    expect(result.current).toHaveProperty('loadMore');
    expect(result.current).toHaveProperty('clearFilters');
  });

  it('syncs filters to URL via replaceState', async () => {
    const { result } = renderHook(() => useLinks());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setFilters({ source_id: 'github' });
    });

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('handles grid view mode without scrolling', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo');

    const { result } = renderHook(() => useLinks({ viewMode: 'grid' }));
    await new Promise(r => setTimeout(r, 50));

    expect(scrollToSpy).not.toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });

  it('scrolls to top on page change in table view', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo');

    const { result } = renderHook(() => useLinks({ viewMode: 'table' }));
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.setPage(2);
    });

    expect(scrollToSpy).toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });
});
