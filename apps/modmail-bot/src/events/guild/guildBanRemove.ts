import { EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await ban.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔓 User Unbanned')
                .setDescription(`**User:** ${ban.user.tag} (${ban.user.id})`)
                .setThumbnail(ban.user.displayAvatarURL())
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging unban:', error);
        }
    },
};
