import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('modmail-setup').setDescription('Setup category'),
    async execute(interaction) {
        await interaction.reply('Setup complete (stub).');
    }
};