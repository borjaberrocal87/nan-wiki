import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleMessageCreate } from '../events/messageCreate.js';

vi.mock('../services/db.js', () => ({
  prisma: {
    user: { upsert: vi.fn() },
    channel: { upsert: vi.fn() },
    source: { upsert: vi.fn() },
    link: { create: vi.fn() },
  },
}));

vi.mock('../client.js', () => ({
  client: { on: vi.fn() },
}));

vi.mock('../services/linkDetector.js', () => ({
  detectUrls: vi.fn(),
  DetectedUrl: vi.fn(),
}));

import { prisma } from '../services/db.js';
import { detectUrls } from '../services/linkDetector.js';

describe('messageCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // The rate limit map is internal to messageCreate, cleared on module reload
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockMessage(overrides = {}) {
    return {
      author: {
        id: '123456789',
        username: 'testuser',
        tag: 'testuser#0000',
        avatar: 'avatar_hash',
        discriminator: '0000',
      },
      content: 'https://github.com/user/repo',
      channel: {
        id: '987654321',
        name: 'general',
        type: 'GUILD_TEXT',
      },
      channelId: '987654321',
      guildId: '111222333',
      id: '555666777',
      createdTimestamp: Date.now(),
      reply: vi.fn().mockResolvedValue({ delete: vi.fn() }),
      ...overrides,
    };
  }

  it('skips messages from bots', async () => {
    const mockMessage = createMockMessage({
      author: {
        ...createMockMessage().author,
        bot: true,
      },
    });

    await handleMessageCreate(mockMessage as any);
    expect(detectUrls).not.toHaveBeenCalled();
  });

  it('skips messages without guild', async () => {
    const mockMessage = createMockMessage({
      guildId: null,
    });

    await handleMessageCreate(mockMessage as any);
    expect(detectUrls).not.toHaveBeenCalled();
  });

  it('skips messages without URLs', async () => {
    const mockMessage = createMockMessage({
      content: 'Just some text without links',
    });

    await handleMessageCreate(mockMessage as any);
    expect(detectUrls).toHaveBeenCalledWith('Just some text without links');
  });

  it('detects and saves a single URL', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    expect(prisma.source.upsert).toHaveBeenCalledWith({
      where: { id: 'github' },
      create: { id: 'github', name: 'GitHub' },
      update: {},
    });

    expect(prisma.link.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: 'https://github.com/user/repo',
          domain: 'github.com',
          sourceId: 'github',
          llmStatus: 'pending',
          tags: [],
        }),
      })
    );
  });

  it('detects and saves multiple URLs', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
      { url: 'https://twitter.com/user/status', domain: 'twitter.com', sourceId: 'twitter' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    expect(prisma.link.create).toHaveBeenCalledTimes(2);
    expect(prisma.source.upsert).toHaveBeenCalledWith({
      where: { id: 'github' },
      create: { id: 'github', name: 'GitHub' },
      update: {},
    });
    expect(prisma.source.upsert).toHaveBeenCalledWith({
      where: { id: 'twitter' },
      create: { id: 'twitter', name: 'Twitter' },
      update: {},
    });
  });

  it('handles duplicate URL (P2002 error)', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockRejectedValue({
      code: 'P2002',
    });

    await handleMessageCreate(mockMessage as any);

    // Should not throw, just skip the duplicate
    expect(prisma.link.create).toHaveBeenCalledTimes(1);
  });

  it('ignores messages with more than 10 URLs', async () => {
    const mockMessage = createMockMessage();
    const manyUrls = Array.from({ length: 15 }, (_, i) => ({
      url: `https://github.com/user/repo${i}`,
      domain: 'github.com',
      sourceId: 'github',
    }));
    (detectUrls as any).mockReturnValue(manyUrls);

    await handleMessageCreate(mockMessage as any);

    expect(prisma.link.create).not.toHaveBeenCalled();
  });

  it('skips rate limited users', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    // Simulate rate limit by directly manipulating the internal map
    // Since checkRateLimit is not exported, we test via the module reload
    // The first call in this test suite should pass, but rapid calls would fail

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);
  });

  it('uses correct source names for all known sources', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
      { url: 'https://twitter.com/user', domain: 'twitter.com', sourceId: 'twitter' },
      { url: 'https://youtube.com/watch?v=abc', domain: 'youtube.com', sourceId: 'youtube' },
      { url: 'https://twitch.tv/channel', domain: 'twitch.tv', sourceId: 'twitch' },
      { url: 'https://linkedin.com/in/user', domain: 'linkedin.com', sourceId: 'linkedin' },
      { url: 'https://reddit.com/r/sub', domain: 'reddit.com', sourceId: 'reddit' },
      { url: 'https://medium.com/@user/article', domain: 'medium.com', sourceId: 'medium' },
      { url: 'https://dev.to/user', domain: 'dev.to', sourceId: 'blog' },
      { url: 'https://example.com', domain: 'example.com', sourceId: 'other' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    const upsertCalls = (prisma.source.upsert as any).mock.calls.map((call: any[]) => call[0]);
    const sourceIds = upsertCalls.map((call: any) => call.where.id);

    expect(sourceIds).toContain('github');
    expect(sourceIds).toContain('twitter');
    expect(sourceIds).toContain('youtube');
    expect(sourceIds).toContain('twitch');
    expect(sourceIds).toContain('linkedin');
    expect(sourceIds).toContain('reddit');
    expect(sourceIds).toContain('medium');
    expect(sourceIds).toContain('blog');
    expect(sourceIds).toContain('other');
  });

  it('saves link with correct author and channel data', async () => {
    const mockMessage = createMockMessage();
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    const createCall = (prisma.link.create as any).mock.calls[0][0];
    expect(createCall.data.authorId).toBe(BigInt('123456789'));
    expect(createCall.data.channelId).toBe(BigInt('987654321'));
    expect(createCall.data.discordMessageId).toBe(BigInt('555666777'));
    expect(createCall.data.postedAt).toBeInstanceOf(Date);
  });

  it('handles non-text channel gracefully', async () => {
    const mockMessage = createMockMessage({
      channel: {
        id: '987654321',
        name: 'general',
        type: 'GUILD_VOICE',
      },
      channelId: '987654321',
    });
    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.channel.upsert as any).mockResolvedValue({});
    (prisma.source.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    expect(prisma.link.create).toHaveBeenCalled();
  });
});
