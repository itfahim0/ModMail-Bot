import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('autorole').setDescription('Set autorole'),
    async execute(interaction) {
        await interaction.reply('Autorole set (stub).');
    }
};