// Discord user identifier
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl?: string;
}

// Known source identifiers (primary keys in the sources table)
export type SourceId =
  | 'github'
  | 'twitter'
  | 'youtube'
  | 'twitch'
  | 'linkedin'
  | 'reddit'
  | 'medium'
  | 'blog'
  | 'other';

// Source display info
export interface Source {
  id: SourceId;
  name: string;
}

// All known sources
export const KNOWN_SOURCES: Source[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'medium', name: 'Medium' },
  { id: 'blog', name: 'Blog' },
  { id: 'other', name: 'Link' },
];

// Source lookup: id → name
export const SOURCE_NAMES: Record<SourceId, string> = {
  github: 'GitHub',
  twitter: 'Twitter',
  youtube: 'YouTube',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  medium: 'Medium',
  blog: 'Blog',
  other: 'Link',
};

// Reverse lookup: name → id
export const NAME_TO_SOURCE_ID: Record<string, SourceId> = {};
for (const source of KNOWN_SOURCES) {
  NAME_TO_SOURCE_ID[source.name.toLowerCase()] = source.id;
}

// LLM processing status
export type LlmStatus = 'pending' | 'processing' | 'done' | 'failed';

// Represents a captured link from Discord
export interface Link {
  id: string;
  url: string;
  domain: string;
  sourceId: SourceId;
  rawContent?: string;
  authorId: string;
  channelId: string;
  channelName?: string;
  discordMessageId?: string;
  postedAt: string;
  llmStatus: LlmStatus;
  title?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Filter parameters for link search
export interface LinkFilters {
  sourceId?: SourceId | SourceId[];
  tags?: string[];
  domain?: string;
  channelId?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

// Paginated API response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
