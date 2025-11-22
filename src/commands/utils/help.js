import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('help').setDescription('Help menu'),
    async execute(interaction) {
        await interaction.reply('Help menu (stub).');
    }
};