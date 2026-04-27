import { client } from '../client.js';
import { prisma } from '../services/db.js';

client.once('clientReady', async () => {
  console.log(`Bot is online as ${client.user?.tag}`);
  await syncChannels();
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

async function syncChannels() {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return;

  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    let synced = 0;

    for (const [, channel] of channels) {
      if (!channel.isTextBased() || channel.isThreadOnly()) continue;

      const category = channel.parent?.name ?? null;
      await prisma.channel.upsert({
        where: { id: BigInt(channel.id) },
        create: {
          id: BigInt(channel.id),
          name: channel.name,
          guildId: BigInt(guildId),
          category: category || undefined,
        },
        update: {
          name: channel.name,
          category: category || undefined,
        },
      });
      synced++;
    }

    console.log(`[BOT] Synced ${synced} channels from guild`);
  } catch (error) {
    console.error('[BOT] Failed to sync channels:', error);
  }
}
