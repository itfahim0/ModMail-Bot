import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('config').setDescription('Bot config'),
    async execute(interaction) {
        await interaction.reply('Config updated (stub).');
    }
};