import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getToken, isLoggedIn } from '../auth';

describe('getToken (client-side)', () => {
  beforeEach(() => {
    document.cookie = 'nan_wiki_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  afterEach(() => {
    document.cookie = 'nan_wiki_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('returns token from cookie when present', () => {
    document.cookie = 'nan_wiki_session=test-token-value; path=/';
    expect(getToken()).toBe('test-token-value');
  });

  it('returns null when cookie is not present', () => {
    expect(getToken()).toBeNull();
  });

  it('decodes URI-encoded token values', () => {
    document.cookie = 'nan_wiki_session=token%20with%20spaces; path=/';
    expect(getToken()).toBe('token with spaces');
  });

  it('returns null when cookie name does not match', () => {
    document.cookie = 'other_cookie=some-value; path=/';
    expect(getToken()).toBeNull();
  });

  it('handles multiple cookies in document.cookie', () => {
    document.cookie = 'other_cookie=value; nan_wiki_session=found-token; path=/';
    expect(getToken()).toBe('found-token');
  });

  it('returns null for empty cookie value', () => {
    expect(getToken()).toBeNull();
  });
});

describe('isLoggedIn', () => {
  beforeEach(() => {
    document.cookie = 'nan_wiki_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  afterEach(() => {
    document.cookie = 'nan_wiki_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('returns true when token exists', () => {
    document.cookie = 'nan_wiki_session=some-token; path=/';
    expect(isLoggedIn()).toBe(true);
  });

  it('returns false when no token exists', () => {
    expect(isLoggedIn()).toBe(false);
  });
});
