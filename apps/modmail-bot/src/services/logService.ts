import { EmbedBuilder } from 'discord.js';

/** Simple logging service for actions */
export async function logAction(guild, title, details, color = '#555555', user = null) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(details)
        .setTimestamp();

    if (user) {
        embed.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) });
        embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
    }

    await channel.send({ embeds: [embed] }).catch(console.error);
}

export function logTicketAction(guild, action, details) {
    return logAction(guild, `Ticket ${action}`, details);
}
