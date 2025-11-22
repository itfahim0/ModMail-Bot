import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('announce').setDescription('Make announcement'),
    async execute(interaction) {
        await interaction.reply('Announcement sent (stub).');
    }
};