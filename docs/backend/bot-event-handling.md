# 🎯 Bot Event Handling Pattern

## 💡 Convention

The Discord bot uses a flat event-driven architecture where each event is implemented in its own file inside `packages/bot/src/events/`. Event handlers are imported and registered in `packages/bot/src/index.ts`, which is the single entry point that calls `startBot()`.

**Structure:**

```
packages/bot/src/
├── index.ts              # Entry point — imports all events, calls startBot()
├── client.ts             # Discord client creation + startBot() export
├── events/
│   ├── ready.ts          # 'ready' event handler
│   ├── messageCreate.ts  # 'messageCreate' event handler
│   └── ...               # One file per event
├── services/
│   ├── linkDetector.ts   # URL detection logic
│   └── db.ts             # Prisma client singleton
└── utils/
    └── ...               # Utility functions
```

**Rules:**
- Each event file exports a single async function that receives the Discord.js event payload (e.g., `Message`, `GuildMember`).
- `index.ts` imports event files and registers them with `client.on(EventName, handler)`.
- `client.ts` creates the client, registers global listeners (ready, error), and exports `startBot()`.
- `index.ts` does NOT contain business logic — it only wires events to handlers.
- Business logic lives in `services/` and is called from event handlers.

## 🏆 Benefits

- Each event is isolated in its own file, making it easy to find, modify, and test.
- `index.ts` stays minimal and readable — it's just a wiring layer.
- New developers can add an event by creating one file and adding one import line.
- Event handlers can be tested independently by importing the exported function directly.
- Clear separation between event registration (index.ts), event handling (events/), and business logic (services/).

## 👀 Examples

### ✅ Good: Clean event separation

**`client.ts`** — Client setup + start function:
```ts
import { Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export async function startBot(): Promise<void> {
  await client.login(process.env.DISCORD_TOKEN);
}
```

**`events/messageCreate.ts`** — Single exported handler:
```ts
import { Message } from 'discord.js';
import { handleMessageCreate } from '../services/messageHandler.js';

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  await handleMessageCreate(message);
}
```

**`index.ts`** — Wiring only:
```ts
import './events/ready.js';
import './events/messageCreate.js';
import { startBot } from './client.js';

startBot().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
```

### ❌ Bad: Monolithic event handler in index.ts

```ts
// BAD: All logic in one file
client.on('ready', () => {
  console.log('Bot online');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const urls = message.content.match(URL_REGEX);
  for (const url of urls) {
    await saveToDatabase(url);
    await sendEmbed(message, url);
  }
});

client.login(process.env.DISCORD_TOKEN);
```

## 🧐 Real world examples

- `packages/bot/src/client.ts` — Client creation and `startBot()`
- `packages/bot/src/events/messageCreate.ts` — URL detection and link saving
- `packages/bot/src/events/ready.ts` — Ready event handler
- `packages/bot/src/index.ts` — Event wiring layer

## 🔗 Related agreements

- [Monorepo structure convention](monorepo-structure.md)
- [Hexagonal Architecture convention](backend/hexagonal-architecture.md)

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
