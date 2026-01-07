import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('View details of a specific case/warning')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Case ID (User ID)')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('id');
        const userData = db.users[userId];

        if (!userData || !userData.warnings || userData.warnings.length === 0) {
            return interaction.reply({ content: '❌ No cases found for this User ID.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`📂 Case File: ${userId}`)
            .setDescription(`Found **${userData.warnings.length}** warning(s).`)
            .setTimestamp();

        userData.warnings.forEach((w, i) => {
            if (i < 25) { // Discord limit
                embed.addFields({
                    name: `Case #${i + 1}`,
                    value: `**Reason:** ${w.reason}\n**Mod:** <@${w.moderator}>\n**Date:** <t:${Math.floor(w.date / 1000)}:d>`
                });
            }
        });

        await interaction.reply({ embeds: [embed] });
    }
};