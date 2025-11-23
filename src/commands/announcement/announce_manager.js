import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { storage } from '../../storage/jsonAdapter.js';

export default {
    data: new SlashCommandBuilder()
        .setName('announce-dm')
        .setDescription('Manage DM announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a new announcement')
                .addStringOption(o => o.setName('content').setDescription('Message content').setRequired(true))
                .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (optional)')))
        .addSubcommand(sub =>
            sub.setName('preview')
                .setDescription('Preview an announcement')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('approve')
                .setDescription('Approve announcement for sending')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('View stats')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true))),

    async execute(interaction) {
        await storage.init();
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const content = interaction.options.getString('content');
            const channel = interaction.options.getChannel('channel');

            const announcement = await storage.createAnnouncement({
                guildId: interaction.guildId,
                creatorId: interaction.user.id,
                content,
                channelId: channel?.id,
                stats: { sent: 0, failed: 0 }
            });

            return interaction.reply({
                content: `📝 **Announcement Created (Draft)**\nID: \`${announcement.id}\`\n\nUse \`/announce-dm preview id:${announcement.id}\` to check it.`,
                ephemeral: true
            });
        }

        if (sub === 'preview') {
            const id = interaction.options.getString('id');
            const ann = await storage.getAnnouncement(id);
            if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('📢 Announcement Preview')
                .setDescription(ann.content)
                .setFooter({ text: `ID: ${ann.id} | Status: ${ann.status}` });

            // Send a test DM to the admin
            try {
                await interaction.user.send({
                    content: `**[PREVIEW]**\n${ann.content}\n\n*To unsubscribe, use /subscribe opt-out*`
                });
                embed.addFields({ name: 'Test DM', value: '✅ Sent to you' });
            } catch (e) {
                embed.addFields({ name: 'Test DM', value: '❌ Failed (Check your DMs)' });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'approve') {
            const id = interaction.options.getString('id');
            const ann = await storage.getAnnouncement(id);
            if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });

            if (ann.status !== 'DRAFT') return interaction.reply({ content: `❌ Status is ${ann.status}, cannot approve.`, ephemeral: true });

            // Count recipients
            const recipients = await storage.listOptIns(interaction.guildId);

            await storage.updateAnnouncement(id, { status: 'APPROVED' });

            return interaction.reply({
                content: `✅ **Announcement Approved!**\nQueued for **${recipients.length}** subscribers.\nThe worker process will start sending shortly.`,
                ephemeral: true
            });
        }

        if (sub === 'stats') {
            const id = interaction.options.getString('id');
            const ann = await storage.getAnnouncement(id);
            if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('📊 Announcement Stats')
                .addFields(
                    { name: 'Status', value: ann.status, inline: true },
                    { name: 'Sent', value: String(ann.stats.sent), inline: true },
                    { name: 'Failed', value: String(ann.stats.failed), inline: true }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
