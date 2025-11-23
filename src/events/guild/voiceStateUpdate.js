import { Events, EmbedBuilder } from 'discord.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (oldState.channelId === newState.channelId) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await newState.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const user = newState.member.user;
            const embed = new EmbedBuilder().setTimestamp();

            if (!oldState.channelId && newState.channelId) {
                embed.setColor('#57F287')
                    .setAuthor({ name: `${user.tag} joined Voice Channel: ${newState.channel.name}`, iconURL: user.displayAvatarURL() });
            } else if (oldState.channelId && !newState.channelId) {
                embed.setColor('#ED4245')
                    .setAuthor({ name: `${user.tag} left Voice Channel: ${oldState.channel.name}`, iconURL: user.displayAvatarURL() });
            } else if (oldState.channelId && newState.channelId) {
                embed.setColor('#FEE75C')
                    .setAuthor({ name: `${user.tag} moved: ${oldState.channel.name} ➡ ${newState.channel.name}`, iconURL: user.displayAvatarURL() });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging voice state:', error);
        }
    }
};