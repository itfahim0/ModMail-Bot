import { Events, EmbedBuilder, AuditLogEvent } from 'discord.js';

export default {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.author?.bot) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await message.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setAuthor({
                    name: `${message.author?.tag || 'Unknown User'} deleted a message`,
                    iconURL: message.author?.displayAvatarURL()
                })
                .addFields(
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Content', value: message.content ? message.content.substring(0, 1024) : '*Content unavailable (uncached)*' }
                )
                .setFooter({ text: `User ID: ${message.author?.id || 'Unknown'}` })
                .setTimestamp();

            if (message.attachments?.size > 0) {
                embed.addFields({ name: 'Attachments', value: `${message.attachments.size} file(s)` });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging message delete:', error);
        }
    }
};