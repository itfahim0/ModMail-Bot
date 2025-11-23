import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔓 User Unbanned')
                .addFields(
                    { name: 'User', value: `${ban.user.tag} (${userId})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
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