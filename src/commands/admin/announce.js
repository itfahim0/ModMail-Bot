import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { storage } from '../../storage/jsonAdapter.js';

// Cache to store mention data temporarily (key: userId, value: { channelId, mentions })
const mentionCache = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announcement management system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Send announcement to a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send announcement')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('mention')
                        .setDescription('Select mention type')
                        .setRequired(false)
                        .addChoices(
                            { name: 'None', value: 'none' },
                            { name: '@everyone', value: 'everyone' },
                            { name: '@here', value: 'here' },
                            { name: 'Custom Mentions', value: 'custom' }
                        ))
                .addMentionableOption(option =>
                    option.setName('mention1')
                        .setDescription('First role/user to mention (if Custom Mentions selected)')
                        .setRequired(false))
                .addMentionableOption(option =>
                    option.setName('mention2')
                        .setDescription('Second role/user to mention (optional)')
                        .setRequired(false))
                .addMentionableOption(option =>
                    option.setName('mention3')
                        .setDescription('Third role/user to mention (optional)')
                        .setRequired(false))
                .addMentionableOption(option =>
                    option.setName('mention4')
                        .setDescription('Fourth role/user to mention (optional)')
                        .setRequired(false))
                .addMentionableOption(option =>
                    option.setName('mention5')
                        .setDescription('Fifth role/user to mention (optional)')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('dm-create')
                .setDescription('Create a mass DM announcement')
                .addStringOption(o => o.setName('content').setDescription('Message content').setRequired(true))
                .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (optional)')))
        .addSubcommand(sub =>
            sub.setName('dm-preview')
                .setDescription('Preview a DM announcement')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('dm-approve')
                .setDescription('Approve DM announcement for sending')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('dm-stats')
                .setDescription('View DM announcement stats')
                .addStringOption(o => o.setName('id').setDescription('Announcement ID').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Channel Announcement
        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            const mentionType = interaction.options.getString('mention') || 'none';

            // Collect all custom mentions
            const mentions = [];
            if (mentionType === 'custom') {
                for (let i = 1; i <= 5; i++) {
                    const mentionable = interaction.options.getMentionable(`mention${i}`);
                    if (mentionable) {
                        mentions.push(mentionable);
                    }
                }
            }

            // Store mention data in cache
            const cacheKey = `${interaction.user.id}_${channel.id}`;
            mentionCache.set(cacheKey, {
                channelId: channel.id,
                mentionType,
                mentions: mentions.map(m => m.id)
            });

            // Clean up old cache entries after 10 minutes
            setTimeout(() => {
                mentionCache.delete(cacheKey);
            }, 10 * 60 * 1000);

            // Show modal for announcement content
            const modal = new ModalBuilder()
                .setCustomId(`announce_modal_${cacheKey}`)
                .setTitle('Create Channel Announcement');

            const titleInput = new TextInputBuilder()
                .setCustomId('announce_title')
                .setLabel('Announcement Title')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(256);

            const messageInput = new TextInputBuilder()
                .setCustomId('announce_message')
                .setLabel('Announcement Message')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(4000);

            const colorInput = new TextInputBuilder()
                .setCustomId('announce_color')
                .setLabel('Embed Color (hex code, e.g., #FF0000)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue('#FF0000')
                .setMaxLength(7);

            const firstRow = new ActionRowBuilder().addComponents(titleInput);
            const secondRow = new ActionRowBuilder().addComponents(messageInput);
            const thirdRow = new ActionRowBuilder().addComponents(colorInput);

            modal.addComponents(firstRow, secondRow, thirdRow);

            await interaction.showModal(modal);
        }

        // DM Create
        else if (subcommand === 'dm-create') {
            await storage.init();
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
                content: `📝 **Announcement Created (Draft)**\nID: \`${announcement.id}\`\n\nUse \`/announce dm-preview id:${announcement.id}\` to check it.`,
                ephemeral: true
            });
        }

        // DM Preview
        else if (subcommand === 'dm-preview') {
            await storage.init();
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

        // DM Approve
        else if (subcommand === 'dm-approve') {
            await storage.init();
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

        // DM Stats
        else if (subcommand === 'dm-stats') {
            await storage.init();
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

// Export the cache so it can be accessed by the interaction handler
export { mentionCache };