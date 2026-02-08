import { ChannelType, EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (channel.type === ChannelType.DM) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await channel.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('📝 Channel Created')
                .setDescription(`**Name:** ${channel.name}\n**Type:** ${channel.type}`)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging channel create:', error);
        }
    },
};
