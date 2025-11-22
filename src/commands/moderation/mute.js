import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('mute').setDescription('Mute user').addUserOption(o=>o.setName('user').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User muted (stub).');
    }
};