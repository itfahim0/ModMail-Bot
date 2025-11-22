import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('warn').setDescription('Warn user').addUserOption(o=>o.setName('user').setRequired(true)).addStringOption(o=>o.setName('reason').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User warned (stub).');
    }
};