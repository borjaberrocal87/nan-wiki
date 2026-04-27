import './events/ready.js';
import './events/messageCreate.js';
import { startBot } from './client.js';

startBot().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
