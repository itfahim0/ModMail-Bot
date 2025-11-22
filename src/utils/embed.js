import { EmbedBuilder } from 'discord.js';
export const createEmbed = (title, desc, color = 'Blue') => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color);