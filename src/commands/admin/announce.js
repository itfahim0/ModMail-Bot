import {
    SlashCommandBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    ComponentType
} from 'discord.js';
import { storage } from '../../storage/jsonAdapter.js';

// Cache to store temporary data for multi-step interactions
const interactionCache = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Open the announcement management menu')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('announce_action')
            .setPlaceholder('Select an action')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Channel Announcement')
                    .setDescription('Send an announcement to a specific channel')
                    .setValue('channel')
                    .setEmoji('📢'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Create DM Announcement')
                    .setDescription('Draft a new mass DM announcement')
                    .setValue('dm-create')
                    .setEmoji('📝'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Preview DM Announcement')
                    .setDescription('Preview a draft before sending')
                    .setValue('dm-preview')
                    .setEmoji('👀'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Approve DM Announcement')
                    .setDescription('Approve and queue a draft for sending')
                    .setValue('dm-approve')
                    .setEmoji('✅'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('View DM Stats')
                    .setDescription('Check status of sent announcements')
                    .setValue('dm-stats')
                    .setEmoji('📊'),
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '👋 **Announcement Manager**\nPlease select an action from the menu below:',
            components: [row],
            ephemeral: true
        });
    },

    async handleInteraction(interaction) {
        // Handle Action Selection
        if (interaction.isStringSelectMenu() && interaction.customId === 'announce_action') {
            const action = interaction.values[0];

            if (action === 'channel') {
                const channelSelect = new ChannelSelectMenuBuilder()
                    .setCustomId('announce_channel_select')
                    .setPlaceholder('Select a channel')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

                const row = new ActionRowBuilder().addComponents(channelSelect);

                await interaction.update({
                    content: '📢 **Channel Announcement**\nSelect the channel where you want to post:',
                    components: [row]
                });
            }
            else if (action === 'dm-create') {
                const modal = new ModalBuilder()
                    .setCustomId('announce_dm_create_modal')
                    .setTitle('Create DM Announcement');

                const contentInput = new TextInputBuilder()
                    .setCustomId('content')
                    .setLabel('Message Content')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(2000);

                modal.addComponents(new ActionRowBuilder().addComponents(contentInput));
                await interaction.showModal(modal);
            }
            else if (['dm-preview', 'dm-approve', 'dm-stats'].includes(action)) {
                const modal = new ModalBuilder()
                    .setCustomId(`announce_${action.replace('-', '_')}_modal`)
                    .setTitle(action.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

                const idInput = new TextInputBuilder()
                    .setCustomId('id')
                    .setLabel('Announcement ID')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(idInput));
                await interaction.showModal(modal);
            }
        }

        // Handle Channel Selection -> Show Modal
        else if (interaction.isChannelSelectMenu() && interaction.customId === 'announce_channel_select') {
            const channelId = interaction.values[0];

            // Store channel ID in cache linked to user ID (since Modals don't pass state)
            // We use user ID because the modal submission comes from the same user
            interactionCache.set(`channel_${interaction.user.id}`, channelId);

            const modal = new ModalBuilder()
                .setCustomId('announce_channel_modal')
                .setTitle('Channel Announcement Details');

            const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const messageInput = new TextInputBuilder()
                .setCustomId('message')
                .setLabel('Message')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const colorInput = new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Color (Hex)')
                .setStyle(TextInputStyle.Short)
                .setValue('#FF0000')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(colorInput)
            );

            await interaction.showModal(modal);
        }

        // Handle Modal Submissions
        else if (interaction.isModalSubmit()) {
            await storage.init();

            // Channel Announcement
            if (interaction.customId === 'announce_channel_modal') {
                const channelId = interactionCache.get(`channel_${interaction.user.id}`);
                if (!channelId) {
                    return interaction.reply({ content: '❌ Session expired. Please try again.', ephemeral: true });
                }

                const title = interaction.fields.getTextInputValue('title');
                const message = interaction.fields.getTextInputValue('message');
                const color = interaction.fields.getTextInputValue('color') || '#FF0000';

                try {
                    const channel = await interaction.guild.channels.fetch(channelId);
                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(message)
                        .setColor(color)
                        .setTimestamp();

                    await channel.send({ embeds: [embed] });
                    await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
                    interactionCache.delete(`channel_${interaction.user.id}`);
                } catch (error) {
                    await interaction.reply({ content: `❌ Failed: ${error.message}`, ephemeral: true });
                }
            }

            // DM Create
            else if (interaction.customId === 'announce_dm_create_modal') {
                const content = interaction.fields.getTextInputValue('content');
                const announcement = await storage.createAnnouncement({
                    guildId: interaction.guildId,
                    creatorId: interaction.user.id,
                    content,
                    stats: { sent: 0, failed: 0 }
                });

                await interaction.reply({
                    content: `📝 **Draft Created!**\nID: \`${announcement.id}\`\nUse **Preview** or **Approve** action with this ID.`,
                    ephemeral: true
                });
            }

            // DM Preview
            else if (interaction.customId === 'announce_dm_preview_modal') {
                const id = interaction.fields.getTextInputValue('id');
                const ann = await storage.getAnnouncement(id);
                if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });

                try {
                    await interaction.user.send({
                        content: `**[PREVIEW]**\n${ann.content}\n\n*To unsubscribe, use /subscribe opt-out*`
                    });
                    await interaction.reply({ content: '✅ Preview sent to your DMs.', ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: '❌ Could not send DM. Check your privacy settings.', ephemeral: true });
                }
            }

            // DM Approve
            else if (interaction.customId === 'announce_dm_approve_modal') {
                const id = interaction.fields.getTextInputValue('id');
                const ann = await storage.getAnnouncement(id);
                if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
                if (ann.status !== 'DRAFT') return interaction.reply({ content: `❌ Status is ${ann.status}`, ephemeral: true });

                const recipients = await storage.listOptIns(interaction.guildId);
                await storage.updateAnnouncement(id, { status: 'APPROVED' });

                await interaction.reply({
                    content: `✅ **Approved!**\nQueued for **${recipients.length}** subscribers.`,
                    ephemeral: true
                });
            }

            // DM Stats
            else if (interaction.customId === 'announce_dm_stats_modal') {
                const id = interaction.fields.getTextInputValue('id');
                const ann = await storage.getAnnouncement(id);
                if (!ann) return interaction.reply({ content: '❌ Not found.', ephemeral: true });

                const embed = new EmbedBuilder()
                    .setTitle('📊 Announcement Stats')
                    .addFields(
                        { name: 'Status', value: ann.status, inline: true },
                        { name: 'Sent', value: String(ann.stats.sent), inline: true },
                        { name: 'Failed', value: String(ann.stats.failed), inline: true }
                    );
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};