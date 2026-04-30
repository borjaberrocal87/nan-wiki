import { describe, it, expect, vi, afterEach } from 'vitest';

describe('syncChannels', () => {
  afterEach(() => {
    delete process.env.DISCORD_GUILD_ID;
    vi.restoreAllMocks();
    vi.doUnmock('../client.js');
    vi.doUnmock('../services/db.js');
    vi.doUnmock('@prisma/client');
  });

  it('registers clientReady event handler', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    const mockOnce = vi.fn();
    const mockOn = vi.fn();
    const mockGuildsFetch = vi.fn().mockResolvedValue({
      channels: { fetch: vi.fn().mockResolvedValue(new Map()) },
    });

    vi.doMock('@prisma/client', () => ({
      PrismaClient: function MockPrisma() {
        this.channel = { upsert: vi.fn() };
      },
    }));

    vi.doMock('../client.js', () => ({
      client: {
        user: { tag: 'TestBot#1234' },
        guilds: { fetch: mockGuildsFetch },
        once: mockOnce,
        on: mockOn,
      },
    }));

    vi.doMock('../services/db.js', () => ({
      prisma: { channel: { upsert: vi.fn() } },
    }));

    process.env.DISCORD_GUILD_ID = '123456789';
    await import('../ready.js');

    expect(mockOnce).toHaveBeenCalledWith('clientReady', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('upserts text-based channels and skips thread-only', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    const mockUpsert = vi.fn().mockResolvedValue({ id: 1n });
    const mockOnce = vi.fn();
    const mockGuildsFetch = vi.fn().mockResolvedValue({
      channels: {
        fetch: vi.fn().mockResolvedValue(
          new Map([
            ['111', { id: '111', name: 'general', isTextBased: () => true, isThreadOnly: () => false, parent: { name: 'General' } }],
            ['222', { id: '222', name: 'thread', isTextBased: () => true, isThreadOnly: () => true, parent: { name: 'General' } }],
          ])
        ),
      },
    });

    vi.doMock('@prisma/client', () => ({
      PrismaClient: function MockPrisma() {
        this.channel = { upsert: mockUpsert };
      },
    }));

    vi.doMock('../client.js', () => ({
      client: {
        user: { tag: 'TestBot#1234' },
        guilds: { fetch: mockGuildsFetch },
        once: mockOnce,
        on: vi.fn(),
      },
    }));

    vi.doMock('../services/db.js', () => ({
      prisma: { channel: { upsert: mockUpsert } },
    }));

    process.env.DISCORD_GUILD_ID = '123456789';
    await import('../ready.js');

    const readyCallback = mockOnce.mock.calls[0][1];
    await readyCallback();

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt('111') },
        create: expect.objectContaining({ id: BigInt('111'), name: 'general', guildId: BigInt('123456789') }),
      })
    );
  });

  it('handles Discord API errors gracefully', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    const mockOnce = vi.fn();
    const mockGuildsFetch = vi.fn().mockRejectedValue(new Error('API Rate limit'));

    vi.doMock('@prisma/client', () => ({
      PrismaClient: function MockPrisma() {
        this.channel = { upsert: vi.fn() };
      },
    }));

    vi.doMock('../client.js', () => ({
      client: {
        user: { tag: 'TestBot#1234' },
        guilds: { fetch: mockGuildsFetch },
        once: mockOnce,
        on: vi.fn(),
      },
    }));

    vi.doMock('../services/db.js', () => ({
      prisma: { channel: { upsert: vi.fn() } },
    }));

    process.env.DISCORD_GUILD_ID = '123456789';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../ready.js');

    const readyCallback = mockOnce.mock.calls[0][1];
    await readyCallback();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[BOT] Failed to sync channels', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
