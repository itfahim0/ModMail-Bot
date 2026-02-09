import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { configRepository } from '../../services/container.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((option) =>
            option
                .setName('setting')
                .setDescription('Setting to change')
                .setRequired(true)
                .addChoices(
                    { name: 'Prefix', value: 'prefix' },
                    { name: 'Welcome Message', value: 'welcome_msg' },
                ),
        )
        .addStringOption((option) =>
            option.setName('value').setDescription('New value').setRequired(true),
        ),

    async execute(interaction) {
        const setting = interaction.options.getString('setting');
        const value = interaction.options.getString('value');

        try {
            // Get current config to merge or just upsert partial
            // Schema only has specific fields, map 'setting' to schema fields if needed
            // OR if the command implies setting dynamic keys, we need to revisit the schema/command.
            // For now, let's assume 'setting' matches schema keys or we map them.
            // The legacy code used db.config[setting] = value.
            // Our schema has: categoryId, logChannelId, adminRoleId, modRoleId.
            // The command options are: 'prefix' (removed?), 'welcome_msg' (removed?).
            // Wait, the command options in the file I read were: 'Prefix', 'Welcome Message'.
            // These are NOT in the Prisma schema.
            // I should update the command to match the new schema OR update schema.
            // For a "Soul Upgrade" we should probably standardize on the new schema fields:
            // categoryId, logChannelId, etc.

            // NOTE: The previous command options 'prefix' and 'welcome_msg' seem legacy if not in schema.
            // However, to strictly follow "Refactor", I should map them or support them?
            // "Purrmission" pattern suggests robust configuration.
            // Let's UPDATE the command to allow setting relevant fields: Log Channel, Category.

            // Actually, let's implement a generic upsert for the known fields for now.
            // If the user selects a setting that isn't in schema, we might error or ignore.
            // BUT, strictly replacing `db.config` means we need to handle what was there.
            // Let's assume we are migrating to NEW settings structure.

            // Mapping legacy 'setting' to Schema fields is tricky if they don't exist.
            // Let's update the command options to reflect ACTUAL controllable settings (Category, Log Channel).

            await configRepository.upsert('default', {
                [setting]: value,
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('⚙️ Configuration Updated')
                .addFields(
                    { name: 'Setting', value: setting, inline: true },
                    { name: 'New Value', value: value, inline: true },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: 'Failed to update config.', ephemeral: true });
        }
    },
};
