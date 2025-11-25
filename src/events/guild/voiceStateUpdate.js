import { AuditLogEvent, Events } from 'discord.js';
import { logAction } from '../../services/logService.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Check if user moved channels (both channels exist and are different)
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const member = newState.member;
            const guild = newState.guild;

            // Fetch Audit Logs to find who moved them
            // We look for MemberMove event in the last few seconds
            try {
                // Wait a short bit to ensure audit log is populated
                await new Promise(r => setTimeout(r, 1000));

                const auditLogs = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberMove,
                    limit: 1,
                });

                const logEntry = auditLogs.entries.first();
                let executor = null;

                // Check if the log entry is recent (within 5 seconds) and targets the moved user
                if (logEntry && logEntry.target.id === member.id && logEntry.createdTimestamp > (Date.now() - 5000)) {
                    executor = logEntry.executor;
                }

                // Only log if moved by someone else
                if (executor && executor.id !== member.id) {
                    await logAction(
                        guild,
                        '🔊 Voice Member Moved',
                        `**User:** ${member.user.tag} (<@${member.id}>)\n**From:** <#${oldState.channelId}>\n**To:** <#${newState.channelId}>\n**Moved By:** ${executor.tag} (<@${executor.id}>)`,
                        '#FFA500'
                    );
                }

            } catch (error) {
                console.error('Error fetching audit logs for voice move:', error);
            }
        }
    },
};