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
                `**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${newState.channelId}>`,
                '#00FF00' // Green
            );
        }

        // Case 2: Member Left a Voice Channel
        else if (oldState.channelId && !newState.channelId) {
            await logAction(
                guild,
                '🔇 Member Left Voice',
                `**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${oldState.channelId}>`,
                '#FF0000' // Red
            );
        }

        // Case 3: Member Moved Channels
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            let movedBy = "Unknown (Self or Bot)";
            let color = '#3498db'; // Blue

            // Attempt to find who moved them via Audit Logs
            try {
                // Wait a moment for audit log to populate
                await new Promise(r => setTimeout(r, 1000));
                const auditLogs = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberMove,
                    limit: 1,
                });

                const logEntry = auditLogs.entries.first();
                if (logEntry && logEntry.target.id === member.id && logEntry.createdTimestamp > (Date.now() - 5000)) {
                    movedBy = `${logEntry.executor.tag} (<@${logEntry.executor.id}>)`;
                    color = '#FFA500'; // Orange if moved by someone else
                } else {
                    movedBy = "Self";
                }
            } catch (e) {
                console.error("Audit log fetch failed", e);
            }

            await logAction(
                guild,
                '↔️ Member Moved Voice',
                `**User:** ${member.user.tag} (<@${member.id}>)\n**From:** <#${oldState.channelId}>\n**To:** <#${newState.channelId}>\n**Moved By:** ${movedBy}`,
                color
            );
        }
    },
};