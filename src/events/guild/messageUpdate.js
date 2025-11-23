import { Events, EmbedBuilder } from 'discord.js';

export default {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        if (!newMessage.guild) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await newMessage.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setAuthor({
                    name: `${newMessage.author.tag} edited a message`,
                    iconURL: newMessage.author.displayAvatarURL()
                })
                .setDescription(`**Channel:** ${newMessage.channel} [Jump to Message](${newMessage.url})`)
                .addFields(
                    { name: 'Before', value: oldMessage.content ? oldMessage.content.substring(0, 1024) : '*Content unavailable*' },
                    { name: 'After', value: newMessage.content ? newMessage.content.substring(0, 1024) : '*Content unavailable*' }
                )
                .setFooter({ text: `User ID: ${newMessage.author.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging message update:', error);
        }
    }
};