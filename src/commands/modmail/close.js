import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('close').setDescription('Close a ticket'),
    async execute(interaction) {
        await interaction.reply('Ticket closed (stub).');
    }
};