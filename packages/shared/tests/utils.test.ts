import { describe, it, expect } from 'vitest';
import { detectSource, extractDomain, isValidUrl } from '../src/index.js';

describe('detectSource', () => {
  it('detects github.com', () => {
    expect(detectSource('https://github.com/user/repo')).toBe('github');
  });

  it('detects github.com with www', () => {
    expect(detectSource('https://www.github.com/user/repo')).toBe('github');
  });

  it('detects gitlab.com', () => {
    expect(detectSource('https://gitlab.com/user/repo')).toBe('github');
  });

  it('detects bitbucket.org', () => {
    expect(detectSource('https://bitbucket.org/user/repo')).toBe('github');
  });

  it('detects x.com', () => {
    expect(detectSource('https://x.com/user/status/123')).toBe('twitter');
  });

  it('detects twitter.com', () => {
    expect(detectSource('https://twitter.com/user/status/123')).toBe('twitter');
  });

  it('detects threads.net', () => {
    expect(detectSource('https://threads.net/@user/post')).toBe('twitter');
  });

  it('detects linkedin.com', () => {
    expect(detectSource('https://linkedin.com/in/user')).toBe('linkedin');
  });

  it('detects youtube.com', () => {
    expect(detectSource('https://youtube.com/watch?v=abc123')).toBe('youtube');
  });

  it('detects youtu.be', () => {
    expect(detectSource('https://youtu.be/abc123')).toBe('youtube');
  });

  it('detects vimeo.com', () => {
    expect(detectSource('https://vimeo.com/123456')).toBe('youtube');
  });

  it('detects twitch.tv', () => {
    expect(detectSource('https://twitch.tv/channel')).toBe('twitch');
  });

  it('detects reddit.com', () => {
    expect(detectSource('https://reddit.com/r/subreddit')).toBe('reddit');
  });

  it('detects medium.com', () => {
    expect(detectSource('https://medium.com/@user/article')).toBe('medium');
  });

  it('detects dev.to', () => {
    expect(detectSource('https://dev.to/user/article')).toBe('blog');
  });

  it('detects hashnode.com', () => {
    expect(detectSource('https://hashnode.com/@user/post')).toBe('blog');
  });

  it('detects substack.com', () => {
    expect(detectSource('https://substack.com/@user')).toBe('blog');
  });

  it('detects github.io as blog', () => {
    expect(detectSource('https://user.github.io')).toBe('blog');
  });

  it('detects wordpress.com as blog', () => {
    expect(detectSource('https://user.wordpress.com')).toBe('blog');
  });

  it('detects blogspot.com as blog', () => {
    expect(detectSource('https://user.blogspot.com')).toBe('blog');
  });

  it('returns other for unknown domains', () => {
    expect(detectSource('https://example.com')).toBe('other');
  });

  it('returns other for unknown domains with subdomains', () => {
    expect(detectSource('https://blog.example.com')).toBe('other');
  });

  it('handles case insensitivity', () => {
    expect(detectSource('https://GitHub.com/user/repo')).toBe('github');
  });

  it('handles URLs with query params', () => {
    expect(detectSource('https://github.com/user/repo?query=value')).toBe('github');
  });

  it('handles URLs with fragments', () => {
    expect(detectSource('https://github.com/user/repo#section')).toBe('github');
  });
});

describe('extractDomain', () => {
  it('extracts domain from http URL', () => {
    expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
  });

  it('extracts domain from https URL', () => {
    expect(extractDomain('http://example.com/path')).toBe('example.com');
  });

  it('strips www prefix', () => {
    expect(extractDomain('https://www.twitter.com/user')).toBe('twitter.com');
  });

  it('handles invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe('unknown');
  });
});

describe('isValidUrl', () => {
  it('returns true for valid https URL', () => {
    expect(isValidUrl('https://github.com')).toBe(true);
  });

  it('returns true for valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('returns false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});
