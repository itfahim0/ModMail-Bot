import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder().setName('claim').setDescription('Claim a ticket'),
    async execute(interaction) {
        await interaction.reply('Ticket claimed (stub).');
    }
};