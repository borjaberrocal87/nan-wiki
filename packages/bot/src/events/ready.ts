import { client } from './client.js';

client.once('ready', () => {
  console.log(`Bot is online as ${client.user?.tag}`);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

export { client };
