import { EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.GuildBanAdd,
    async execute(ban) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await ban.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 User Banned')
                .setDescription(`**User:** ${ban.user.tag} (${ban.user.id})`)
                .setThumbnail(ban.user.displayAvatarURL())
                .setTimestamp();

            if (ban.reason) {
                embed.addFields({ name: 'Reason', value: ban.reason });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging ban:', error);
        }
    },
};
