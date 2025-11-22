import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('panel').setDescription('Admin panel'),
    async execute(interaction) {
        await interaction.reply('Panel opened (stub).');
    }
};