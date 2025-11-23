import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { storage } from '../../storage/jsonAdapter.js';

export default {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Manage your DM announcement subscription')
        .addSubcommand(sub =>
            sub.setName('opt-in').setDescription('Subscribe to server announcements via DM'))
        .addSubcommand(sub =>
            sub.setName('opt-out').setDescription('Unsubscribe from DM announcements'))
        .addSubcommand(sub =>
            sub.setName('status').setDescription('Check your subscription status')),

    async execute(interaction) {
        await storage.init(); // Ensure DB is ready
        const subcommand = interaction.options.getSubcommand();
        const { guildId, user } = interaction;

        if (subcommand === 'opt-in') {
            await storage.setOptIn({ guildId, userId: user.id, status: 'active' });
            return interaction.reply({
                content: '✅ You have **subscribed** to DM announcements from this server.',
                ephemeral: true
            });
        }

        if (subcommand === 'opt-out') {
            await storage.setOptIn({ guildId, userId: user.id, status: 'unsubscribed' });
            return interaction.reply({
                content: '🔕 You have **unsubscribed**. You will no longer receive DM announcements.',
                ephemeral: true
            });
        }

        if (subcommand === 'status') {
            const optIn = await storage.getOptIn(guildId, user.id);
            const status = optIn?.status === 'active' ? '✅ Subscribed' : '❌ Not Subscribed';
            return interaction.reply({ content: `Your status: **${status}**`, ephemeral: true });
        }
    }
};
