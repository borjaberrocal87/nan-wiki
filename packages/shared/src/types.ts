// Discord user identifier
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl?: string;
}

// Detected source type for a link
export type LinkSource =
  | 'github'
  | 'twitter'
  | 'youtube'
  | 'twitch'
  | 'linkedin'
  | 'reddit'
  | 'medium'
  | 'blog'
  | 'other';

// LLM processing status
export type LlmStatus = 'pending' | 'processing' | 'done' | 'failed';

// Represents a captured link from Discord
export interface Link {
  id: string;
  url: string;
  domain: string;
  source: LinkSource;
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
  source?: LinkSource | LinkSource[];
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
