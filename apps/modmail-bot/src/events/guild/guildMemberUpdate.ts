import { EmbedBuilder, Events } from 'discord.js';

export default {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await newMember.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            // Nickname Change
            if (oldMember.nickname !== newMember.nickname) {
                const embed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setAuthor({
                        name: `${newMember.user.tag} updated nickname`,
                        iconURL: newMember.user.displayAvatarURL(),
                    })
                    .setDescription(
                        `**${oldMember.nickname || oldMember.user.username}** ➡ **${newMember.nickname || newMember.user.username}**`,
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            // Role Changes
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            if (oldRoles.size !== newRoles.size) {
                const added = newRoles.filter((r) => !oldRoles.has(r.id)).first();
                const removed = oldRoles.filter((r) => !newRoles.has(r.id)).first();

                if (added) {
                    const embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setAuthor({
                            name: `${newMember.user.tag} was given a role`,
                            iconURL: newMember.user.displayAvatarURL(),
                        })
                        .setDescription(`**Role:** ${added.name}`)
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }

                if (removed) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setAuthor({
                            name: `${newMember.user.tag} was removed from a role`,
                            iconURL: newMember.user.displayAvatarURL(),
                        })
                        .setDescription(`**Role:** ${removed.name}`)
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Error logging member update:', error);
        }
    },
};
