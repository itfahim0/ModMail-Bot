import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('meme').setDescription('Get a meme'),
    async execute(interaction) {
        await interaction.reply('Meme (stub).');
    }
};