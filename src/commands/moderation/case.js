import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('case').setDescription('View case').addStringOption(o=>o.setName('id').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('Case info (stub).');
    }
};