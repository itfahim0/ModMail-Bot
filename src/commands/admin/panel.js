import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Show admin panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🛡️ Admin Control Panel')
            .setDescription('Manage your server settings and bot configuration.')
            .addFields(
                { name: 'Auto-Role', value: db.config?.autoRole ? `<@&${db.config.autoRole}>` : 'Not Set', inline: true },
                { name: 'Log Channel', value: process.env.LOG_CHANNEL_ID ? `<#${process.env.LOG_CHANNEL_ID}>` : 'Not Set', inline: true },
                { name: 'ModMail Category', value: process.env.MODMAIL_CATEGORY_ID ? `<#${process.env.MODMAIL_CATEGORY_ID}>` : 'Not Set', inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_panel')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setLabel('Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com') // Placeholder
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};