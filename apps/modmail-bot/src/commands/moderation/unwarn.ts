import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { warningRepository } from '../../services/container.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a warning from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) =>
            option.setName('user').setDescription('User to unwarn').setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName('index')
                .setDescription('Warning number to remove (from /history)')
                .setRequired(true),
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const index = interaction.options.getInteger('index') - 1;

        const warnings = await warningRepository.findByUserId(user.id);

        if (warnings.length === 0) {
            return interaction.reply({ content: '❌ This user has no warnings.', ephemeral: true });
        }

        if (index < 0 || index >= warnings.length) {
            return interaction.reply({ content: '❌ Invalid warning number.', ephemeral: true });
        }

        // Warnings are ordered DESC by default in repo (most recent first)
        // But the legacy code splice implies index based access.
        // If users rely on "Warning #1" matching visual list, we need to respect that order.
        // Repository `findByUserId` orders by `createdAt: 'desc'`.
        // So index 0 is most recent.

        const warningToDelete = warnings[index];
        await warningRepository.delete(warningToDelete.id);

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🗑️ Warning Removed')
            .setDescription(`Removed warning #${index + 1} from ${user.tag}`)
            .addFields({ name: 'Original Reason', value: warningToDelete.reason })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
