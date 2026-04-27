import { isValidUrl, extractDomain, detectSource } from '@link-library/shared';

const URL_REGEX =
  /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

export interface DetectedUrl {
  url: string;
  domain: string;
  source: string;
}

export function detectUrls(content: string): DetectedUrl[] {
  const matches = content.match(URL_REGEX);
  if (!matches) return [];

  const results: DetectedUrl[] = [];

  for (const rawUrl of matches) {
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    if (!isValidUrl(url)) continue;

    const domain = extractDomain(url);
    const source = detectSource(url);

    results.push({ url, domain, source });
  }

  return results;
}
