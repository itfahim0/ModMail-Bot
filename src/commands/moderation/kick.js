import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kick')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot kick yourself.', ephemeral: true });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: '❌ You cannot kick someone with a higher or equal role.', ephemeral: true });
        }

        try {
            await member.send(`👢 You have been kicked from **${interaction.guild.name}**\nReason: ${reason}`).catch(() => { });
            await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('👢 User Kicked')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.reply({ content: `❌ Failed to kick user: ${error.message}`, ephemeral: true });
        }
    }
};