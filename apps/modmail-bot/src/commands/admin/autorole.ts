import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { configRepository } from '../../services/container.js';

export default {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Set the role given to new members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption((option) =>
            option.setName('role').setDescription('Role to assign').setRequired(true),
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('role');

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ I cannot assign a role higher than or equal to my own highest role.',
                ephemeral: true,
            });
        }

        await configRepository.upsert('default', { autoRoleId: role.id });

        await interaction.reply({
            content: `✅ Auto-role set to **${role.name}**`,
            ephemeral: true,
        });
    },
};
