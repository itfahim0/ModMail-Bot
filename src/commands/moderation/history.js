import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../../database/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View moderation history of a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view history')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const userData = db.users[user.id] || { warnings: [] };

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`📜 History for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        if (userData.warnings.length === 0) {
            embed.setDescription('✅ No warnings found.');
        } else {
            const history = userData.warnings.map((w, i) =>
                `**${i + 1}.** ${w.reason} - <@${w.moderator}> (<t:${Math.floor(w.date / 1000)}:R>)`
            ).join('\n');
            embed.setDescription(history.substring(0, 4096));
        }

        await interaction.reply({ embeds: [embed] });
    }
};