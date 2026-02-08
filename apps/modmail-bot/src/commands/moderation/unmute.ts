import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption((option) =>
            option.setName('user').setDescription('User to unmute').setRequired(true),
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true,
            });
        }

        if (!member.isCommunicationDisabled()) {
            return interaction.reply({ content: '❌ This user is not muted.', ephemeral: true });
        }

        try {
            await member.timeout(null, `Unmuted by ${interaction.user.tag}`);
            await member
                .send(`🔊 You have been unmuted in **${interaction.guild.name}**`)
                .catch(() => {});

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔊 User Unmuted')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = await interaction.guild.channels
                    .fetch(logChannelId)
                    .catch(() => null);
                if (logChannel) await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to unmute user: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};
