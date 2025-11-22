import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('transcript').setDescription('Generate transcript'),
    async execute(interaction) {
        await interaction.reply('Transcript generated (stub).');
    }
};