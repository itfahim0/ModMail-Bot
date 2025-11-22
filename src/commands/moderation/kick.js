import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('kick').setDescription('Kick user').addUserOption(o=>o.setName('user').setRequired(true)),
    async execute(interaction) {
        await interaction.reply('User kicked (stub).');
    }
};