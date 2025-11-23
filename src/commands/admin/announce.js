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
    RoleSelectMenuBuilder,
    UserSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
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
        const userId = interaction.user.id;

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

        // Handle Channel Selection -> Show Mention Config
        else if (interaction.isChannelSelectMenu() && interaction.customId === 'announce_channel_select') {
            const channelId = interaction.values[0];

            // Pre-fetch members to ensure User Select Menu works
            // This helps populate the cache so the select menu isn't empty
            await interaction.guild.members.fetch().catch(() => { });

            // Initialize cache
            interactionCache.set(userId, {
                channelId,
                mentionType: 'none',
                mentionRoles: [],
                mentionUsers: []
            });

            // Components for Mention Config
            const typeSelect = new StringSelectMenuBuilder()
                .setCustomId('announce_mention_type')
                .setPlaceholder('Select Mention Type (Optional)')
                .addOptions(
                    { label: 'None', value: 'none' },
                    { label: '@everyone', value: 'everyone' },
                    { label: '@here', value: 'here' }
                );

            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId('announce_mention_roles')
                .setPlaceholder('Select Roles to Mention (Optional)')
                .setMinValues(0)
                .setMaxValues(5);

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId('announce_mention_users')
                .setPlaceholder('Select Users to Mention (Optional)')
                .setMinValues(0)
                .setMaxValues(5);

            const confirmBtn = new ButtonBuilder()
                .setCustomId('announce_mention_confirm')
                .setLabel('Continue to Message')
                .setStyle(ButtonStyle.Primary);

            await interaction.update({
                content: `📢 **Configure Mentions**\nSelected Channel: <#${channelId}>\n\nChoose who to mention (optional), then click **Continue**.`,
                components: [
                    new ActionRowBuilder().addComponents(typeSelect),
                    new ActionRowBuilder().addComponents(roleSelect),
                    new ActionRowBuilder().addComponents(userSelect),
                    new ActionRowBuilder().addComponents(confirmBtn)
                ]
            });
        }

        // Handle Mention Updates (Update Cache)
        else if (interaction.customId === 'announce_mention_type') {
            const data = interactionCache.get(userId) || {};
            data.mentionType = interaction.values[0];
            interactionCache.set(userId, data);
            await interaction.deferUpdate();
        }
        else if (interaction.customId === 'announce_mention_roles') {
            const data = interactionCache.get(userId) || {};
            data.mentionRoles = interaction.values;
            interactionCache.set(userId, data);
            await interaction.deferUpdate();
        }
        else if (interaction.customId === 'announce_mention_users') {
            const data = interactionCache.get(userId) || {};
            data.mentionUsers = interaction.values;
            interactionCache.set(userId, data);
            await interaction.deferUpdate();
        }

        // Handle Confirm -> Show Modal
        else if (interaction.isButton() && interaction.customId === 'announce_mention_confirm') {
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
                const data = interactionCache.get(userId);
                if (!data || !data.channelId) {
                    return interaction.reply({ content: '❌ Session expired. Please try again.', ephemeral: true });
                }

                const title = interaction.fields.getTextInputValue('title');
                const message = interaction.fields.getTextInputValue('message');
                const color = interaction.fields.getTextInputValue('color') || '#FF0000';

                try {
                    const channel = await interaction.guild.channels.fetch(data.channelId);

                    // Construct Mention String
                    let mentions = [];
                    if (data.mentionType === 'everyone') mentions.push('@everyone');
                    if (data.mentionType === 'here') mentions.push('@here');
                    if (data.mentionRoles) mentions.push(...data.mentionRoles.map(id => `<@&${id}>`));
                    if (data.mentionUsers) mentions.push(...data.mentionUsers.map(id => `<@${id}>`));

                    const mentionString = mentions.join(' ');

                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(message)
                        .setColor(color)
                        .setTimestamp();

                    await channel.send({
                        content: mentionString.length > 0 ? mentionString : null,
                        embeds: [embed]
                    });

                    await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
                    interactionCache.delete(userId);
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