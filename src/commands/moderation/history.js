import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('history').setDescription('View user history').addUserOption(o=>o.setName('user').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User history (stub).');
    }
};