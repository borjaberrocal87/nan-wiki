import { describe, it, expect } from 'vitest';
import {
  getSourceColor,
  getIconPath,
  getRelativeDate,
  SOURCE_CONFIG,
  type SourceType,
} from '../sources';

describe('getSourceColor', () => {
  it('returns correct color for github', () => {
    expect(getSourceColor('github')).toBe('#f0f6fc');
  });

  it('returns correct color for twitter', () => {
    expect(getSourceColor('twitter')).toBe('#1b95e0');
  });

  it('returns correct color for youtube', () => {
    expect(getSourceColor('youtube')).toBe('#ff0000');
  });

  it('returns correct color for twitch', () => {
    expect(getSourceColor('twitch')).toBe('#9146ff');
  });

  it('returns correct color for linkedin', () => {
    expect(getSourceColor('linkedin')).toBe('#0a66c2');
  });

  it('returns correct color for reddit', () => {
    expect(getSourceColor('reddit')).toBe('#ff4500');
  });

  it('returns correct color for medium', () => {
    expect(getSourceColor('medium')).toBe('#00ab48');
  });

  it('returns correct color for blog', () => {
    expect(getSourceColor('blog')).toBe('#aaaaaa');
  });

  it('returns correct color for other', () => {
    expect(getSourceColor('other')).toBe('#aaaaaa');
  });

  it('is case-insensitive', () => {
    expect(getSourceColor('GITHUB')).toBe('#f0f6fc');
    expect(getSourceColor('GitHub')).toBe('#f0f6fc');
    expect(getSourceColor('gItHuB')).toBe('#f0f6fc');
  });

  it('returns default #aaaaaa for unknown sources', () => {
    expect(getSourceColor('unknown_source')).toBe('#aaaaaa');
  });

  it('returns default #aaaaaa for null input', () => {
    expect(getSourceColor(null as unknown as string)).toBe('#aaaaaa');
  });

  it('returns default #aaaaaa for empty string', () => {
    expect(getSourceColor('')).toBe('#aaaaaa');
  });

  it('returns all source colors from SOURCE_CONFIG', () => {
    const sourceTypes: SourceType[] = ['github', 'twitter', 'youtube', 'twitch', 'linkedin', 'reddit', 'medium', 'blog', 'other'];
    for (const source of sourceTypes) {
      expect(getSourceColor(source)).toBe(SOURCE_CONFIG[source].color);
    }
  });
});

describe('getIconPath', () => {
  it('returns correct icon path for github', () => {
    const icon = getIconPath('github');
    expect(icon).toBe(SOURCE_CONFIG.github.icon);
    expect(icon.length).toBeGreaterThan(100);
  });

  it('returns correct icon path for twitter', () => {
    expect(getIconPath('twitter')).toBe(SOURCE_CONFIG.twitter.icon);
  });

  it('returns correct icon path for youtube', () => {
    expect(getIconPath('youtube')).toBe(SOURCE_CONFIG.youtube.icon);
  });

  it('returns correct icon path for all known sources', () => {
    const sourceTypes: SourceType[] = ['github', 'twitter', 'youtube', 'twitch', 'linkedin', 'reddit', 'medium', 'blog', 'other'];
    for (const source of sourceTypes) {
      expect(getIconPath(source)).toBe(SOURCE_CONFIG[source].icon);
    }
  });

  it('is case-insensitive', () => {
    expect(getIconPath('GITHUB')).toBe(SOURCE_CONFIG.github.icon);
    expect(getIconPath('TWITTER')).toBe(SOURCE_CONFIG.twitter.icon);
  });

  it('returns empty string for unknown sources', () => {
    expect(getIconPath('unknown')).toBe('');
  });

  it('returns other icon for null input', () => {
    expect(getIconPath(null as unknown as string)).toBe(SOURCE_CONFIG.other.icon);
  });

  it('returns other icon for empty string', () => {
    expect(getIconPath('')).toBe(SOURCE_CONFIG.other.icon);
  });
});

describe('getRelativeDate', () => {
  it('returns "just now" for current time', () => {
    const now = new Date().toISOString();
    expect(getRelativeDate(now)).toBe('just now');
  });

  it('returns minutes ago for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(getRelativeDate(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago for today', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago for recent past', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(twoDaysAgo)).toBe('2d ago');
  });

  it('returns months ago for older dates', () => {
    const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(oneMonthAgo)).toBe('1mo ago');
  });

  it('returns months ago for several months', () => {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(sixMonthsAgo)).toBe('6mo ago');
  });

  it('returns years ago for old dates', () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(twoYearsAgo)).toBe('2y ago');
  });

  it('handles edge case: 59 seconds = just now', () => {
    const fiftyNineSecAgo = new Date(Date.now() - 59 * 1000).toISOString();
    expect(getRelativeDate(fiftyNineSecAgo)).toBe('just now');
  });

  it('handles edge case: 60 seconds = 1m ago', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(getRelativeDate(oneMinAgo)).toBe('1m ago');
  });

  it('handles edge case: 23 hours = 23h ago', () => {
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(twentyThreeHoursAgo)).toBe('23h ago');
  });

  it('handles edge case: 29 days = 29d ago', () => {
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(twentyNineDaysAgo)).toBe('29d ago');
  });

  it('handles edge case: 11 months = 11mo ago', () => {
    const elevenMonthsAgo = new Date(Date.now() - 330 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDate(elevenMonthsAgo)).toBe('11mo ago');
  });
});
