import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('reply').setDescription('Reply to a ticket').addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('Reply sent (stub).');
    }
};