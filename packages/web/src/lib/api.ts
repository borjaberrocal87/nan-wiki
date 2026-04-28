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

export interface LinkItem {
  id: string;
  url: string;
  domain: string;
  source: string;
  raw_content: string | null;
  author_id: number | null;
  channel_id: number | null;
  channel_name: string | null;
  discord_message_id: number | null;
  posted_at: string;
  llm_status: string;
  title: string | null;
  description: string | null;
  tags: string[];
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
  source: string;
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
  await apiFetch('/api/auth/logout', { method: 'POST' });
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

export async function fetchAuthMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me');
}
