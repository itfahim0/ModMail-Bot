import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('giveaway').setDescription('Start giveaway'),
    async execute(interaction) {
        await interaction.reply('Giveaway started (stub).');
    }
};