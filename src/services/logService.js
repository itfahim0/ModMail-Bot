import { EmbedBuilder } from 'discord.js';

/** Simple logging service for actions */
export async function logAction(guild, title, details, color = '#555555') {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(details)
        .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(console.error);
}

export function logTicketAction(guild, action, details) {
    return logAction(guild, `Ticket ${action}`, details);
}
