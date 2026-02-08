import { ChannelType, EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.ChannelDelete,
    async execute(channel) {
        if (channel.type === ChannelType.DM) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await channel.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🗑️ Channel Deleted')
                .setDescription(`**Name:** ${channel.name}`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging channel delete:', error);
        }
    },
};
