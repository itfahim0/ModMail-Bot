// src/commands/admin/exportTickets.js
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('export-tickets')
        .setDescription('Export all tickets to a CSV file')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Placeholder implementation – real DB export logic would go here
        await interaction.reply({
            content: '🗂️ Exporting tickets is not implemented yet.',
            ephemeral: true,
        });
    },
};
