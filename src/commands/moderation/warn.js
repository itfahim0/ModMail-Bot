import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db, saveDB } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
        }

        try {
            // Save warning to database
            if (!db.users[user.id]) {
                db.users[user.id] = { warnings: [], history: [], notes: [] };
            }
            db.users[user.id].warnings = db.users[user.id].warnings || [];
            db.users[user.id].warnings.push({
                reason,
                moderator: interaction.user.id,
                date: Date.now()
            });
            saveDB();

            await user.send(`⚠️ You have been warned in **${interaction.guild.name}**\nReason: ${reason}\nTotal warnings: ${db.users[user.id].warnings.length}`).catch(() => { });

            const embed = new EmbedBuilder()
                .setColor('#FFFF00')
                .setTitle('⚠️ User Warned')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Total Warnings', value: `${db.users[user.id].warnings.length}`, inline: true },
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
            await interaction.reply({ content: `❌ Failed to warn user: ${error.message}`, ephemeral: true });
        }
    }
};