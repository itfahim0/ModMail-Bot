import { storage } from '../storage/jsonAdapter.js';
import { EmbedBuilder } from 'discord.js';

const CONFIG = {
    BATCH_SIZE: 10,
    BATCH_DELAY_MS: 5000, // 5 seconds between batches
    MAX_RETRIES: 3,
    PAUSE_THRESHOLD: 0.2 // Pause if > 20% failure rate
};

export class DmWorker {
    constructor(client) {
        this.client = client;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('👷 DM Worker Started');
        this.loop();
    }

    async loop() {
        while (this.isRunning) {
            try {
                // Find APPROVED or SENDING announcements
                const announcements = await storage.listAnnouncements();
                const active = announcements.find(a => a.status === 'APPROVED' || a.status === 'SENDING');

                if (active) {
                    await this.processAnnouncement(active);
                }
            } catch (error) {
                console.error('Worker Error:', error);
            }
            // Wait before next poll
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    async processAnnouncement(announcement) {
        console.log(`Processing Announcement ${announcement.id}...`);

        // Update status to SENDING if needed
        if (announcement.status === 'APPROVED') {
            await storage.updateAnnouncement(announcement.id, { status: 'SENDING' });
        }

        // Fetch all members instead of opt-ins
        const guild = await this.client.guilds.fetch(announcement.guildId).catch(() => null);
        if (!guild) {
            console.error(`Guild ${announcement.guildId} not found for announcement ${announcement.id}`);
            await storage.updateAnnouncement(announcement.id, { status: 'FAILED' });
            return;
        }

        // Fetch all members (force fetch to ensure we get everyone)
        const members = await guild.members.fetch();
        const subscribers = members.filter(m => !m.user.bot).map(m => ({ userId: m.id }));

        const logs = await storage.getDmLogs(announcement.id);
        const sentUserIds = new Set(logs.map(l => l.userId));

        // Filter pending users
        const pendingUsers = subscribers.filter(u => !sentUserIds.has(u.userId));

        if (pendingUsers.length === 0) {
            await storage.updateAnnouncement(announcement.id, { status: 'COMPLETED' });
            console.log(`Announcement ${announcement.id} Completed!`);
            return;
        }

        // Process Batch
        const batch = pendingUsers.slice(0, CONFIG.BATCH_SIZE);
        let batchFailures = 0;

        for (const sub of batch) {
            try {
                const user = await this.client.users.fetch(sub.userId);

                // Personalized Message
                const message = `**📢 Announcement from ${announcement.guildId}**\n\n${announcement.content}`;

                await user.send(message);

                await storage.appendDmLog({
                    announcementId: announcement.id,
                    userId: sub.userId,
                    status: 'SENT'
                });

                // Update stats
                announcement.stats.sent++;
            } catch (error) {
                console.error(`Failed to DM ${sub.userId}:`, error.message);

                await storage.appendDmLog({
                    announcementId: announcement.id,
                    userId: sub.userId,
                    status: 'FAILED',
                    error: error.message
                });

                announcement.stats.failed++;
                batchFailures++;
            }
        }

        // Save progress stats
        await storage.updateAnnouncement(announcement.id, { stats: announcement.stats });

        // Safety Pause Check
        const failureRate = announcement.stats.failed / (announcement.stats.sent + announcement.stats.failed);
        if (announcement.stats.failed > 5 && failureRate > CONFIG.PAUSE_THRESHOLD) {
            await storage.updateAnnouncement(announcement.id, { status: 'PAUSED' });
            console.warn(`⚠️ Announcement ${announcement.id} PAUSED due to high failure rate (${(failureRate * 100).toFixed(1)}%)`);
            return; // Exit loop for this announcement
        }

        // Rate Limit Delay
        await new Promise(r => setTimeout(r, CONFIG.BATCH_DELAY_MS));
    }
}
