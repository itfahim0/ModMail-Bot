import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('stats').setDescription('Bot stats'),
    async execute(interaction) {
        await interaction.reply('Stats (stub).');
    }
};