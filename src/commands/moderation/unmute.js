import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('unmute').setDescription('Unmute user').addUserOption(o=>o.setName('user').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User unmuted (stub).');
    }
};