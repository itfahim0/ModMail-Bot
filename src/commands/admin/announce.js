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
                    .setLabel('Mass DM Announcement')
                    .setDescription('Send a DM to all subscribed members immediately')
                    .setValue('dm-mass')
                    .setEmoji('📨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Channel & Mass DM')
                    .setDescription('Send to both channel and DMs')
                    .setValue('both')
                    .setEmoji('🚀'),
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

            if (action === 'channel' || action === 'both') {
                const channelSelect = new ChannelSelectMenuBuilder()
                    .setCustomId('announce_channel_select')
                    .setPlaceholder('Select a channel')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

                const row = new ActionRowBuilder().addComponents(channelSelect);

                await interaction.update({
                    content: `📢 **${action === 'both' ? 'Channel & Mass DM' : 'Channel Announcement'}**\nSelect the channel where you want to post:`,
                    components: [row]
                });

                // Store the action type so we know if it's 'channel' or 'both' later
                interactionCache.set(userId, { actionType: action });
            }
            else if (action === 'dm-mass') {
                const modal = new ModalBuilder()
                    .setCustomId('announce_dm_mass_modal')
                    .setTitle('Mass DM Details');

                const titleInput = new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('Title')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const contentInput = new TextInputBuilder()
                    .setCustomId('content')
                    .setLabel('Message Content')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(2000);

                const footerInput = new TextInputBuilder()
                    .setCustomId('footer')
                    .setLabel('Footer Text (Optional)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(contentInput),
                    new ActionRowBuilder().addComponents(footerInput)
                );
                await interaction.showModal(modal);
            }
            else if (action === 'dm-stats') {
                const modal = new ModalBuilder()
                    .setCustomId('announce_dm_stats_modal')
                    .setTitle('View DM Stats');

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
            // Note: This might be slow on very large servers, but is necessary for the select menu to populate correctly if not cached.
            await interaction.guild.members.fetch({ force: true }).catch(err => console.error("Failed to fetch members:", err));

            // Initialize cache (preserve actionType if set)
            const existingData = interactionCache.get(userId) || {};
            interactionCache.set(userId, {
                ...existingData,
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
                .setMaxValues(25);

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId('announce_mention_users')
                .setPlaceholder('Select Users to Mention (Optional)')
                .setMinValues(0)
                .setMaxValues(25); // Increased to 25

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

            const footerInput = new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Footer Text (Optional)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(footerInput)
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
                const footer = interaction.fields.getTextInputValue('footer');

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
                        .setColor('#FF0000') // Default color since input was removed
                        .setTimestamp();

                    if (footer) {
                        embed.setFooter({ text: footer });
                    }

                    await channel.send({
                        content: mentionString.length > 0 ? mentionString : null,
                        embeds: [embed]
                    });

                    let replyMessage = `✅ Announcement sent to ${channel}!`;

                    // If action was 'both', also trigger Mass DM
                    if (data.actionType === 'both') {
                        // Format content for DM
                        let finalContent = `**${title}**\n\n${message}`;
                        if (footer) {
                            finalContent += `\n\n*${footer}*`;
                        }

                        const announcement = await storage.createAnnouncement({
                            guildId: interaction.guildId,
                            creatorId: interaction.user.id,
                            content: finalContent,
                            stats: { sent: 0, failed: 0 }
                        });

                        await storage.updateAnnouncement(announcement.id, { status: 'APPROVED' });
                        replyMessage += `\n✅ **Mass DM Started!** (ID: \`${announcement.id}\`)`;
                    }

                    await interaction.reply({ content: replyMessage, ephemeral: true });
                    interactionCache.delete(userId);
                } catch (error) {
                    await interaction.reply({ content: `❌ Failed: ${error.message}`, ephemeral: true });
                }
            }

            // DM Mass Send (Immediate)
            else if (interaction.customId === 'announce_dm_mass_modal') {
                const title = interaction.fields.getTextInputValue('title');
                const content = interaction.fields.getTextInputValue('content');
                const footer = interaction.fields.getTextInputValue('footer');

                // Format content to include Title and Footer for the DM
                let finalContent = `**${title}**\n\n${content}`;
                if (footer) {
                    finalContent += `\n\n*${footer}*`;
                }

                const announcement = await storage.createAnnouncement({
                    guildId: interaction.guildId,
                    creatorId: interaction.user.id,
                    content: finalContent,
                    stats: { sent: 0, failed: 0 }
                });

                // Immediately approve to trigger worker
                await storage.updateAnnouncement(announcement.id, { status: 'APPROVED' });

                await interaction.reply({
                    content: `✅ **Mass DM Started!**\nID: \`${announcement.id}\`\nThe bot is now sending DMs to all subscribed members in the background.\nYou can check progress with **View DM Stats**.`,
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