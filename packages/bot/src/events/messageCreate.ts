import {
  ActionRowBuilder,
  EmbedBuilder,
  Events,
  Message,
  TextChannel,
} from 'discord.js';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { client } from '../client.js';
import { prisma } from '../services/db.js';
import { detectUrls, DetectedUrl } from '../services/linkDetector.js';

const CONFIRM_EMBED_TIMEOUT = 15_000;

function buildConfirmEmbed(detected: DetectedUrl[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('Link captured')
    .setDescription(
      `Found **${detected.length}** link${detected.length > 1 ? 's' : ''} in your message.`
    )
    .addFields(
      {
        name: 'Links',
        value: detected
          .map((d) => `- ${d.url} \`${d.source}\``)
          .join('\n'),
      }
    )
    .setFooter({ text: 'Will be processed shortly' })
    .setTimestamp();

  return embed;
}

function buildDuplicateEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xf2c74e)
    .setTitle('Link already exists')
    .setDescription('This link has already been captured.')
    .setTimestamp();
}

function buildErrorEmbed(error: unknown): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xf23f42)
    .setTitle('Error capturing link')
    .setDescription('An error occurred while saving this link. The link may still have been captured.')
    .setTimestamp();
}

async function ensureUser(message: Message) {
  await prisma.user.upsert({
    where: { id: BigInt(message.author.id) },
    create: {
      id: BigInt(message.author.id),
      username: message.author.username,
      avatarUrl: message.author.avatar,
      discriminator: message.author.discriminator,
    },
    update: {
      username: message.author.username,
      avatarUrl: message.author.avatar,
      discriminator: message.author.discriminator,
    },
  });
}

async function ensureChannel(channelId: string, guildId: string, channelName: string) {
  await prisma.channel.upsert({
    where: { id: BigInt(channelId) },
    create: {
      id: BigInt(channelId),
      name: channelName,
      guildId: BigInt(guildId),
    },
    update: {},
  });
}

async function saveLink(
  url: string,
  domain: string,
  source: string,
  message: Message
): Promise<boolean> {
  try {
    await ensureUser(message);
    if (message.channelId && message.guildId) {
      const channelName = message.channel instanceof TextChannel ? message.channel.name : `channel-${message.channelId}`;
      await ensureChannel(message.channelId, message.guildId, channelName);
    }
    await prisma.link.create({
      data: {
        url,
        domain,
        source,
        rawContent: message.content.slice(0, 500),
        authorId: BigInt(message.author.id),
        channelId: message.channelId ? BigInt(message.channelId) : undefined,
        discordMessageId: message.id ? BigInt(message.id) : undefined,
        discordChannelName:
          message.channel instanceof TextChannel
            ? message.channel.name
            : undefined,
        postedAt: new Date(message.createdTimestamp),
        llmStatus: 'pending',
        tags: [],
      },
    });
    return true;
  } catch (error) {
    // Unique constraint violation means duplicate
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return false;
    }
    throw error;
  }
}

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guildId) return;

  const detected = detectUrls(message.content);
  if (detected.length === 0) return;

  let savedCount = 0;
  let hasDuplicate = false;

  for (const link of detected) {
    try {
      const saved = await saveLink(link.url, link.domain, link.source, message);
      if (!saved) {
        hasDuplicate = true;
        continue;
      }
      savedCount++;
    } catch (error) {
      console.error(`[LINK] Error saving ${link.url}:`, error);
    }
  }

  if (savedCount === 0) {
    await message.reply({ embeds: [buildDuplicateEmbed()] });
    return;
  }

  const embed = buildConfirmEmbed(detected);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('View all links')
      .setStyle(ButtonStyle.Link)
      .setURL(
        `${process.env.WEB_URL || 'http://localhost:3000'}/links?domain=${detected[0].domain}`
      )
  );

  try {
    const reply = await message.reply({ embeds: [embed], components: [row] });
    setTimeout(() => {
      void reply.edit({ components: [] }).catch(() => {});
    }, CONFIRM_EMBED_TIMEOUT);
  } catch {
    // Reply failed, ignore
  }

  console.log(
    `[LINK] Saved ${savedCount} link(s) from ${message.author.tag} in ${message.guildId}`
  );
}

client.on(Events.MessageCreate, handleMessageCreate);
