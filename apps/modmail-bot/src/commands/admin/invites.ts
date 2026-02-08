import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('List all active invites for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const invites = await interaction.guild.invites.fetch();

            if (invites.size === 0) {
                return interaction.editReply('❌ No active invites found for this server.');
            }

            // Sort by uses (descending)
            const sortedInvites = invites.sort((a, b) => b.uses - a.uses);

            const embed = new EmbedBuilder()
                .setTitle(`📨 Active Invites (${invites.size})`)
                .setColor('#0099ff')
                .setTimestamp();

            // Discord embeds have a field limit of 25. We'll show top 10.
            let description = '';
            let count = 0;

            for (const [code, invite] of sortedInvites) {
                if (count >= 15) {
                    description += `\n...and ${invites.size - 15} more.`;
                    break;
                }

                const creator = invite.inviter ? invite.inviter.tag : 'Unknown';
                const uses = `${invite.uses}/${invite.maxUses === 0 ? '∞' : invite.maxUses}`;
                const expiry = invite.expiresAt
                    ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>`
                    : 'Never';

                description += `**\`${code}\`** • Created by **${creator}**\nUses: \`${uses}\` • Expires: ${expiry}\n\n`;
                count++;
            }

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching invites:', error);
            await interaction.editReply('❌ Failed to fetch invites. Check bot permissions.');
        }
    },
};
