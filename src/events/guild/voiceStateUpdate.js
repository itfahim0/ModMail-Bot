import { AuditLogEvent, Events } from 'discord.js';
import { logAction } from '../../services/logService.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        const guild = newState.guild || oldState.guild;

        if (!member || !guild) return;

        // Case 1: Member Joined a Voice Channel
        if (!oldState.channelId && newState.channelId) {
            await logAction(
                guild,
                '🔊 Member Joined Voice',
                `**User:** ${member.user} (<@${member.id}>)\n**Channel:** <#${newState.channelId}>`,
                '#00FF00', // Green
                member.user
            );
        }

        // Case 2: Member Left a Voice Channel
        else if (oldState.channelId && !newState.channelId) {
            await logAction(
                guild,
                '🔇 Member Left Voice',
                `**User:** ${member.user} (<@${member.id}>)\n**Channel:** <#${oldState.channelId}>`,
                '#FF0000', // Red
                member.user
            );
        }

        // Case 3: Member Moved Channels
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            let movedBy = "Unknown (Self or Bot)";
            let color = '#3498db'; // Blue

            // Attempt to find who moved them via Audit Logs
            try {
                // Wait a moment for audit log to populate (Discord can be slow to update logs)
                await new Promise(r => setTimeout(r, 2000));

                const auditLogs = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberMove,
                    limit: 5, // Check last 5 entries in case of spam
                });

                // Find the log entry for this specific user created in the last 10 seconds
                const logEntry = auditLogs.entries.find(entry =>
                    entry.target.id === member.id &&
                    entry.createdTimestamp > (Date.now() - 10000)
                );

                if (logEntry) {
                    movedBy = `${logEntry.executor} (<@${logEntry.executor.id}>)`;
                    color = '#FFA500'; // Orange if moved by someone else
                } else {
                    movedBy = "Self"; // If no audit log exists, it was likely a self-move
                }
            } catch (e) {
                console.error("Audit log fetch failed", e);
            }

            await logAction(
                guild,
                '↔️ Member Moved Voice',
                `**User:** ${member.user} (<@${member.id}>)\n**From:** <#${oldState.channelId}>\n**To:** <#${newState.channelId}>\n**Moved By:** ${movedBy}`,
                color,
                member.user
            );
        }
    },
};