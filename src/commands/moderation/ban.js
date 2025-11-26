import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: '❌ You cannot ban someone with a higher or equal role.', ephemeral: true });
        }

        try {
            // Create Unban Request Button
            const unbanBtn = new ButtonBuilder()
                .setCustomId(`request_unban_${interaction.guild.id}`)
                .setLabel('Request Unban')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔓');

            const row = new ActionRowBuilder().addComponents(unbanBtn);

            await member.send({
                content: `🔨 You have been banned from **${interaction.guild.name}**\nReason: ${reason}`,
                components: [row]
            }).catch(() => { });

            await member.ban({ reason: `${reason} | Banned by ${interaction.user.tag}` });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 User Banned')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Log to log channel if set
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.reply({ content: `❌ Failed to ban user: ${error.message}`, ephemeral: true });
        }
    }
};