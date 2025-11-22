import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('ban').setDescription('Ban user').addUserOption(o=>o.setName('user').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User banned (stub).');
    }
};