import { Events } from 'discord.js';
import { logAction } from '../../services/logService.js';

export default {
    name: Events.InviteCreate,
    async execute(invite) {
        const guild = invite.guild;
        if (!guild) return;

        await logAction(
            guild,
            '📨 Invite Created',
            `**Creator:** ${invite.inviter ? `${invite.inviter} (<@${invite.inviter.id}>)` : 'Unknown'}\n**Code:** \`${invite.code}\`\n**Channel:** <#${invite.channelId}>\n**Max Uses:** ${invite.maxUses === 0 ? 'Infinite' : invite.maxUses}\n**Expires:** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Never'}`,
            '#00FFFF', // Cyan
            invite.inviter
        );
    },
};
