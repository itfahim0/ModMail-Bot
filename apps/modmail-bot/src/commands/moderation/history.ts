import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { warningRepository } from '../../services/container.js';

export default {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View moderation history of a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) =>
            option.setName('user').setDescription('User to view history').setRequired(true),
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const warnings = await warningRepository.findByUserId(user.id);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`📜 History for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        if (warnings.length === 0) {
            embed.setDescription('✅ No warnings found.');
        } else {
            const history = warnings
                .map(
                    (w, i) =>
                        `**${i + 1}.** ${w.reason} - <@${w.moderatorId}> (<t:${Math.floor(w.createdAt.getTime() / 1000)}:R>)`,
                )
                .join('\n');
            embed.setDescription(history.substring(0, 4096));
        }

        await interaction.reply({ embeds: [embed] });
    },
};
