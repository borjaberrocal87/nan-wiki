export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export interface TagItem {
  id: string;
  name: string;
}

export interface LinkItem {
  id: string;
  url: string;
  domain: string;
  source_id: string;
  source_name: string | null;
  author_id: number | null;
  author_username: string | null;
  channel_id: number | null;
  channel_name: string | null;
  discord_message_id: number | null;
  posted_at: string;
  llm_status: string;
  title: string | null;
  description: string | null;
  tags: TagItem[];
  source_detected: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLinksResponse {
  data: LinkItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface SourceItem {
  id: string;
  name: string;
}

export interface SourcesResponse {
  data: SourceItem[];
}

export async function fetchLinks(params: Record<string, string | number> = {}): Promise<PaginatedLinksResponse> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  return apiFetch<PaginatedLinksResponse>(`/api/links${query ? `?${query}` : ''}`);
}

export async function fetchLinkById(id: string): Promise<{ data: LinkItem }> {
  return apiFetch<{ data: LinkItem }>(`/api/links/${id}`);
}

export async function fetchSources(): Promise<SourcesResponse> {
  return apiFetch<SourcesResponse>('/api/links/sources');
}

export async function fetchAuthors(): Promise<SourcesResponse> {
  return apiFetch<SourcesResponse>('/api/links/authors');
}

export async function fetchChannels(): Promise<SourcesResponse> {
  return apiFetch<SourcesResponse>('/api/links/channels');
}

export async function fetchTags(): Promise<SourcesResponse> {
  return apiFetch<SourcesResponse>('/api/links/tags');
}

export async function exchangeDiscordToken(code: string, state: string): Promise<{ token: string }> {
  const response = await fetch(`/api/auth/discord/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange token');
  }

  return response.json();
}

export async function apiLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export interface AuthUser {
  discordId: string;
  username: string;
  isAdmin: boolean;
  namespace: string;
  role: string;
  roles: string[];
  expiresAt: string;
}

export interface TopAuthor {
  username: string;
  linkCount: number;
}

export interface StatsResponse {
  totalLinks: number;
  linksToday: number;
  linksThisWeek: number;
  totalAuthors: number;
  userLinkCount: number;
  contributionPercent: number;
  topAuthors: TopAuthor[];
}

export async function fetchAuthMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me');
}

export async function fetchStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>('/api/stats');
}

export interface SearchResponse {
  data: LinkItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  references?: string[];
  timestamp: Date;
}

export async function sendChatMessage(message: string): Promise<{ message: string; references: string[] }> {
  const response = await fetch(`/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export async function sendChatMessageStream(
  message: string,
  onChunk: (content: string) => void,
  onReferences?: (urls: string[]) => void,
  onError?: (error: string) => void,
): Promise<void> {
  const response = await fetch(`/api/chat/message/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'chunk') {
            onChunk(parsed.content);
          } else if (parsed.type === 'references' && onReferences) {
            onReferences(parsed.urls);
          } else if (parsed.type === 'error' && onError) {
            onError(parsed.message);
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function searchLinks(
  query: string,
  type: 'hybrid' | 'text' = 'text',
  embedding?: string,
  page: number = 1,
  per_page: number = 20,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
    page: String(page),
    per_page: String(per_page),
  });
  if (embedding) {
    params.set('embedding', embedding);
  }
  return apiFetch<SearchResponse>(`/api/links/search?${params.toString()}`);
}
