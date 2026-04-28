import { DOMAIN_SOURCE_MAP, DOMAIN_PATTERNS } from './constants.js';

/**
 * Detect the source ID of a URL based on its domain.
 * Returns a source ID string (e.g., 'github', 'twitter', 'blog', 'other').
 */
export function detectSource(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase();

    // Check exact domain match first
    if (domain in DOMAIN_SOURCE_MAP) {
      return DOMAIN_SOURCE_MAP[domain];
    }

    // Check pattern matching for dynamic domains
    for (const pattern of DOMAIN_PATTERNS) {
      if (pattern.regex.test(domain)) {
        return pattern.sourceId;
      }
    }

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Extract the domain from a URL string.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Validate if a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
