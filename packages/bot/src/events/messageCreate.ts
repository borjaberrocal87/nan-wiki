import { Events, Message } from 'discord.js';
import { isValidUrl, extractDomain, detectSource } from '@link-library/shared';

const URL_REGEX = /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;

  const content = message.content;
  const urls = content.match(URL_REGEX);
  if (!urls || urls.length === 0) return;

  for (const rawUrl of urls) {
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    if (!isValidUrl(url)) continue;

    const domain = extractDomain(url);
    const source = detectSource(url);

    console.log(`[LINK] Captured: ${url} (source: ${source}, domain: ${domain})`);

    // TODO: Save to database (HU-1.4)
    // TODO: Respond with embed confirmation (HU-1.4)
  }
}
