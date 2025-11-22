import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
};