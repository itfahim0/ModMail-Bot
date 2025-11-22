import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('unban').setDescription('Unban user').addStringOption(o=>o.setName('userid').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User unbanned (stub).');
    }
};