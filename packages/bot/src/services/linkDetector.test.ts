import { describe, it, expect } from 'vitest';
import { detectUrls, type DetectedUrl } from './linkDetector.js';

describe('detectUrls', () => {
  it('detects a single github URL', () => {
    const result = detectUrls('Check this out: https://github.com/user/repo');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://github.com/user/repo');
    expect(result[0].domain).toBe('github.com');
    expect(result[0].sourceId).toBe('github');
  });

  it('detects a single twitter URL', () => {
    const result = detectUrls('Follow me: https://twitter.com/user/status/123');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('twitter');
  });

  it('detects a single youtube URL', () => {
    const result = detectUrls('Watch this: https://youtube.com/watch?v=abc123');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('youtube');
  });

  it('detects multiple URLs in one message', () => {
    const result = detectUrls(
      'Check these: https://github.com/user/repo and https://twitter.com/user/status'
    );
    expect(result).toHaveLength(2);
    expect(result[0].sourceId).toBe('github');
    expect(result[1].sourceId).toBe('twitter');
  });

  it('adds https to URLs without protocol', () => {
    const result = detectUrls('Check www.github.com/user/repo');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://www.github.com/user/repo');
  });

  it('returns empty array for no URLs', () => {
    const result = detectUrls('Just some text without any links');
    expect(result).toHaveLength(0);
  });

  it('filters out invalid URLs', () => {
    const result = detectUrls('Not a url: http://notavalidurl');
    expect(result).toHaveLength(0);
  });

  it('detects twitch.tv URLs', () => {
    const result = detectUrls('https://twitch.tv/channel');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('twitch');
  });

  it('detects reddit URLs', () => {
    const result = detectUrls('https://reddit.com/r/subreddit');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('reddit');
  });

  it('detects medium URLs', () => {
    const result = detectUrls('https://medium.com/@user/article');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('medium');
  });

  it('detects blog URLs (dev.to)', () => {
    const result = detectUrls('https://dev.to/user/article');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('blog');
  });

  it('detects unknown domains as other', () => {
    const result = detectUrls('https://example.com/something');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('other');
  });

  it('handles URLs with query params', () => {
    const result = detectUrls('https://github.com/user/repo?query=value&foo=bar');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://github.com/user/repo?query=value&foo=bar');
  });

  it('handles URLs with fragments', () => {
    const result = detectUrls('https://github.com/user/repo#readme');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://github.com/user/repo#readme');
  });

  it('handles multiple URLs of the same type', () => {
    const result = detectUrls(
      'https://github.com/user/repo1 and https://github.com/user/repo2'
    );
    expect(result).toHaveLength(2);
    expect(result[0].sourceId).toBe('github');
    expect(result[1].sourceId).toBe('github');
  });

  it('detects x.com URLs', () => {
    const result = detectUrls('https://x.com/user/status/456');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('twitter');
  });

  it('detects linkedin URLs', () => {
    const result = detectUrls('https://linkedin.com/in/user');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('linkedin');
  });

  it('detects youtu.be URLs', () => {
    const result = detectUrls('https://youtu.be/abc123');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('youtube');
  });

  it('detects multiple different source types', () => {
    const result = detectUrls(
      'https://github.com/user/repo https://twitter.com/user https://youtube.com/watch?v=abc'
    );
    expect(result).toHaveLength(3);
    expect(result[0].sourceId).toBe('github');
    expect(result[1].sourceId).toBe('twitter');
    expect(result[2].sourceId).toBe('youtube');
  });
});
