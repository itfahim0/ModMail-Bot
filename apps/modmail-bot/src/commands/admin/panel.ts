import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';

import { configRepository } from '../../services/container.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Show admin panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const config = await configRepository.get('default');

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🛡️ Admin Control Panel')
            .setDescription('Manage your server settings and bot configuration.')
            .addFields(
                {
                    name: 'Auto-Role',
                    value: config?.autoRoleId ? `<@&${config.autoRoleId}>` : 'Not Set',
                    inline: true,
                },
                {
                    name: 'Log Channel',
                    value: process.env.LOG_CHANNEL_ID
                        ? `<#${process.env.LOG_CHANNEL_ID}>`
                        : 'Not Set',
                    inline: true,
                },
                {
                    name: 'ModMail Category',
                    value: process.env.MODMAIL_CATEGORY_ID
                        ? `<#${process.env.MODMAIL_CATEGORY_ID}>`
                        : 'Not Set',
                    inline: true,
                },
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('refresh_panel')
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setLabel('Dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com'), // Placeholder
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
