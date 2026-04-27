import { Events } from 'discord.js';
import { handleMessageCreate } from '../events/messageCreate.js';
import { client } from '../client.js';

client.on(Events.MessageCreate, handleMessageCreate);
