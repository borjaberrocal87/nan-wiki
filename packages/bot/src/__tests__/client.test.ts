import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Discord client setup', () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.DISCORD_TOKEN;
  });

  afterEach(() => {
    if (originalToken !== undefined) {
      process.env.DISCORD_TOKEN = originalToken;
    } else {
      delete process.env.DISCORD_TOKEN;
    }
    vi.resetModules();
  });

  it('exports a client with correct intents', async () => {
    process.env.DISCORD_TOKEN = 'test-token-for-testing';
    const { client } = await import('../client.js');
    expect(client).toBeDefined();
    expect(client.user).toBeUndefined();
  });

  it('exports startBot function', async () => {
    process.env.DISCORD_TOKEN = 'test-token-for-testing';
    const { startBot } = await import('../client.js');
    expect(typeof startBot).toBe('function');
  });

  it('throws when DISCORD_TOKEN is missing', async () => {
    delete process.env.DISCORD_TOKEN;

    await expect(import('../client.js')).rejects.toThrow('DISCORD_TOKEN is not set');
  });

  it('client is created with expected gateway intents', async () => {
    process.env.DISCORD_TOKEN = 'test-token-for-testing';
    const { GatewayIntentBits } = await import('discord.js');
    const { client } = await import('../client.js');
    expect(client).toBeDefined();
  });
});

describe('startBot', () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.DISCORD_TOKEN;
    process.env.DISCORD_TOKEN = 'test-token';
  });

  afterEach(() => {
    if (originalToken !== undefined) {
      process.env.DISCORD_TOKEN = originalToken;
    } else {
      delete process.env.DISCORD_TOKEN;
    }
    vi.restoreAllMocks();
  });

  it('calls client.login with the token', async () => {
    const { startBot, client } = await import('../client.js');
    const loginSpy = vi.spyOn(client, 'login').mockResolvedValue(undefined as any);

    await startBot();

    expect(loginSpy).toHaveBeenCalledWith('test-token');
  });
});
