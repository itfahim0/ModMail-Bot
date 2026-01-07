import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID to unban')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                return interaction.reply({ content: '❌ This user is not banned.', ephemeral: true });
            }

            await interaction.guild.members.unban(userId, `Unbanned by ${interaction.user.tag}`);

            // Create Invite
            let inviteUrl = 'No invite available';
            const channel = interaction.guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(interaction.guild.members.me).has('CreateInstantInvite'));
            if (channel) {
                const invite = await channel.createInvite({ maxUses: 1, unique: true, reason: 'Unban Invite' });
                inviteUrl = invite.url;
            }

            // DM User
            try {
                const user = await interaction.client.users.fetch(userId);
                await user.send(`🔓 You have been unbanned from **${interaction.guild.name}**!\nJoin back here: ${inviteUrl}`);
            } catch (e) {
                console.error('Failed to DM unbanned user:', e);
            }

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔓 User Unbanned')
                .addFields(
                    { name: 'User', value: `${ban.user.tag} (${userId})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Invite Sent', value: inviteUrl !== 'No invite available' ? 'Yes' : 'No' }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.reply({ content: `❌ Failed to unban user: ${error.message}`, ephemeral: true });
        }
    }
};