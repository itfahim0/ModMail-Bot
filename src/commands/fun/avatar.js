import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('avatar').setDescription('Get user avatar').addUserOption(o=>o.setName('user')),
    async execute(interaction) {
        await interaction.reply('Avatar (stub).');
    }
};