import { EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await member.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setAuthor({
                    name: `${member.user.tag} left the server`,
                    iconURL: member.user.displayAvatarURL(),
                })
                .setFooter({ text: `User ID: ${member.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging member leave:', error);
        }
    },
};
