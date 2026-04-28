// Mapping of known domains to their source ID (matches sources table)
export const DOMAIN_SOURCE_MAP: Record<string, string> = {
  // Social media
  'x.com': 'twitter',
  'twitter.com': 'twitter',
  'linkedin.com': 'linkedin',
  'reddit.com': 'reddit',
  'threads.net': 'twitter',

  // Video
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'vimeo.com': 'youtube',
  'twitch.tv': 'twitch',

  // Code
  'github.com': 'github',
  'gitlab.com': 'github',
  'bitbucket.org': 'github',

  // Blogging
  'medium.com': 'medium',
  'dev.to': 'blog',
  'hashnode.com': 'blog',
  'substack.com': 'blog',
};

// Domain pattern matching for dynamic domains (blogs, personal sites)
export const DOMAIN_PATTERNS = [
  { regex: /\.github\.io$/, sourceId: 'blog' },
  { regex: /\.wordpress\.com$/, sourceId: 'blog' },
  { regex: /\.blogspot\.com$/, sourceId: 'blog' },
];
