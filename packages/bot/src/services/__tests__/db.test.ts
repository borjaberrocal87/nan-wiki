import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db';

describe('Prisma singleton', () => {
  it('exports a prisma client instance', () => {
    expect(prisma).toBeDefined();
    expect(prisma).toHaveProperty('channel');
    expect(prisma).toHaveProperty('link');
    expect(prisma).toHaveProperty('user');
    expect(prisma).toHaveProperty('source');
  });

  it('prisma client has expected methods', () => {
    expect(typeof prisma.channel.upsert).toBe('function');
    expect(typeof prisma.channel.findMany).toBe('function');
    expect(typeof prisma.link.create).toBe('function');
    expect(typeof prisma.link.findUnique).toBe('function');
    expect(typeof prisma.user.upsert).toBe('function');
    expect(typeof prisma.source.upsert).toBe('function');
  });
});
