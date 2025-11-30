import {
    SlashCommandBuilder,
    EmbedBuilder,
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

// Cache to store temporary data for multi-step interactions
const interactionCache = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Open the announcement management menu')
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Upload a file (Image, Video, PDF, etc.)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Add an external link (e.g. YouTube, Article)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const attachment = interaction.options.getAttachment('attachment');
        const link = interaction.options.getString('link');
        const userId = interaction.user.id;

        // Initialize cache
        interactionCache.set(userId, {
            attachment: attachment, // Store full object
            link: link,
            channelId: null,
            mentionRoles: [],
            mentionUsers: [],
            message: '', // Will be set via interactive chat
            footer: '', // Optional, can be added via chat parsing if needed, but keeping simple for now
            color: '#2B2D31'
        });

        await this.renderDashboard(interaction);
    },

    async renderDashboard(interaction, isUpdate = false) {
        const userId = interaction.user.id;
        const data = interactionCache.get(userId);

        if (!data) {
            return interaction.reply({ content: '❌ Session expired. Please run /announce again.', ephemeral: true });
        }

        // --- Build Dashboard Embed (Admin View Only) ---
        const dashboardEmbed = new EmbedBuilder()
            .setTitle('📢 Announcement Dashboard')
            .setDescription('Configure your announcement below.\n\n**Preview of Message Content:**')
            .setColor(data.color)
            .setTimestamp();

        if (data.message) {
            dashboardEmbed.addFields({ name: 'Content', value: data.message.length > 1024 ? data.message.substring(0, 1021) + '...' : data.message });
        } else {
            dashboardEmbed.addFields({ name: 'Content', value: '*No message set. Click "Set Message" to type it.*' });
        }

        // Preview Image if attachment is an image
        if (data.attachment && data.attachment.contentType && data.attachment.contentType.startsWith('image/')) {
            dashboardEmbed.setImage(data.attachment.url);
        }

        // --- Build Status Fields ---
        let status = `**Target Channel:** ${data.channelId ? `<#${data.channelId}>` : '❌ Not Selected'}`;

        const mentions = [];
        if (data.mentionRoles.length > 0) mentions.push(`${data.mentionRoles.length} Roles`);
        if (data.mentionUsers.length > 0) mentions.push(`${data.mentionUsers.length} Users`);
        status += `\n**Mentions:** ${mentions.length > 0 ? mentions.join(', ') : 'None'}`;

        if (data.attachment) {
            status += `\n**Attachment:** ${data.attachment.name}`;
        }
        if (data.link) {
            status += `\n**Link:** ${data.link}`;
        }

        dashboardEmbed.addFields({ name: 'Settings', value: status });

        // --- Build Components ---

        // Row 1: Target Channel
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('announce_target_channel')
            .setPlaceholder('Select Target Channel (Where to post)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setMaxValues(1);

        // Row 2: Mention Roles
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('announce_mention_roles')
            .setPlaceholder('Select Roles to Mention')
            .setMinValues(0)
            .setMaxValues(25);

        // Row 3: Mention Users
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('announce_mention_users')
            .setPlaceholder('Select Users to Mention')
            .setMinValues(0)
            .setMaxValues(25);

        // Row 4: Buttons
        const setMessageBtn = new ButtonBuilder()
            .setCustomId('announce_set_message')
            .setLabel('Set Message')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary);

        const sendBtn = new ButtonBuilder()
            .setCustomId('announce_send')
            .setLabel('Send Announcement')
            .setEmoji('🚀')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!data.channelId || !data.message);

        const cancelBtn = new ButtonBuilder()
            .setCustomId('announce_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const rows = [
            new ActionRowBuilder().addComponents(channelSelect),
            new ActionRowBuilder().addComponents(roleSelect),
            new ActionRowBuilder().addComponents(userSelect),
            new ActionRowBuilder().addComponents(setMessageBtn, sendBtn, cancelBtn)
        ];

        const payload = {
            embeds: [dashboardEmbed],
            components: rows,
            ephemeral: true
        };

        if (isUpdate) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload);
            } else {
                await interaction.update(payload);
            }
        } else {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(payload);
            } else {
                await interaction.reply(payload);
            }
        }
    },

    async handleInteraction(interaction) {
        const userId = interaction.user.id;
        const data = interactionCache.get(userId);

        if (!data) {
            if (interaction.isButton() || interaction.isAnySelectMenu()) {
                return interaction.reply({ content: '❌ Session expired. Please run /announce again.', ephemeral: true });
            }
            return;
        }

        // --- Handle Select Menus ---
        if (interaction.customId === 'announce_target_channel') {
            data.channelId = interaction.values[0];
            interactionCache.set(userId, data);
            await this.renderDashboard(interaction, true);
        }
        else if (interaction.customId === 'announce_mention_roles') {
            data.mentionRoles = interaction.values;
            interactionCache.set(userId, data);
            await this.renderDashboard(interaction, true);
        }
        else if (interaction.customId === 'announce_mention_users') {
            data.mentionUsers = interaction.values;
            interactionCache.set(userId, data);
            await this.renderDashboard(interaction, true);
        }

        // --- Handle Buttons ---
        else if (interaction.customId === 'announce_set_message') {
            await interaction.deferUpdate();
            const msg = await interaction.followUp({
                content: '✍️ **Please type your announcement message in this channel now.**\n\n- You can use multiple lines, emojis, and formatting.\n- Max 2000 characters.\n- Type `cancel` to abort.',
                ephemeral: true
            });

            const filter = m => m.author.id === userId;
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 120000 });
            import {
                SlashCommandBuilder,
                EmbedBuilder,
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

            // Cache to store temporary data for multi-step interactions
            const interactionCache = new Map();

            export default {
                data: new SlashCommandBuilder()
                    .setName('announce')
                    .setDescription('Open the announcement management menu')
                    .addAttachmentOption(option =>
                        option.setName('attachment')
                            .setDescription('Upload a file (Image, Video, PDF, etc.)')
                            .setRequired(false)
                    )
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('Add an external link (e.g. YouTube, Article)')
                            .setRequired(false)
                    )
                    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

                async execute(interaction) {
                    const attachment = interaction.options.getAttachment('attachment');
                    const link = interaction.options.getString('link');
                    const userId = interaction.user.id;

                    // Initialize cache
                    interactionCache.set(userId, {
                        attachment: attachment, // Store full object
                        link: link,
                        channelId: null,
                        mentionRoles: [],
                        mentionUsers: [],
                        message: '', // Will be set via interactive chat
                        footer: '', // Optional, can be added via chat parsing if needed, but keeping simple for now
                        color: '#2B2D31'
                    });

                    await this.renderDashboard(interaction);
                },

                async renderDashboard(interaction, isUpdate = false) {
                    const userId = interaction.user.id;
                    const data = interactionCache.get(userId);

                    if (!data) {
                        return interaction.reply({ content: '❌ Session expired. Please run /announce again.', ephemeral: true });
                    }

                    // --- Build Dashboard Embed (Admin View Only) ---
                    const dashboardEmbed = new EmbedBuilder()
                        .setTitle('📢 Announcement Dashboard')
                        .setDescription('Configure your announcement below.\n\n**Preview of Message Content:**')
                        .setColor(data.color)
                        .setTimestamp();

                    if (data.message) {
                        dashboardEmbed.addFields({ name: 'Content', value: data.message.length > 1024 ? data.message.substring(0, 1021) + '...' : data.message });
                    } else {
                        dashboardEmbed.addFields({ name: 'Content', value: '*No message set. Click "Set Message" to type it.*' });
                    }

                    // Preview Image if attachment is an image
                    if (data.attachment && data.attachment.contentType && data.attachment.contentType.startsWith('image/')) {
                        dashboardEmbed.setImage(data.attachment.url);
                    }

                    // --- Build Status Fields ---
                    let status = `**Target Channel:** ${data.channelId ? `<#${data.channelId}>` : '❌ Not Selected'}`;

                    const mentions = [];
                    if (data.mentionRoles.length > 0) mentions.push(`${data.mentionRoles.length} Roles`);
                    if (data.mentionUsers.length > 0) mentions.push(`${data.mentionUsers.length} Users`);
                    status += `\n**Mentions:** ${mentions.length > 0 ? mentions.join(', ') : 'None'}`;

                    if (data.attachment) {
                        status += `\n**Attachment:** ${data.attachment.name}`;
                    }
                    if (data.link) {
                        status += `\n**Link:** ${data.link}`;
                    }

                    dashboardEmbed.addFields({ name: 'Settings', value: status });

                    // --- Build Components ---

                    // Row 1: Target Channel
                    const channelSelect = new ChannelSelectMenuBuilder()
                        .setCustomId('announce_target_channel')
                        .setPlaceholder('Select Target Channel (Where to post)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setMaxValues(1);

                    // Row 2: Mention Roles
                    const roleSelect = new RoleSelectMenuBuilder()
                        .setCustomId('announce_mention_roles')
                        .setPlaceholder('Select Roles to Mention')
                        .setMinValues(0)
                        .setMaxValues(25);

                    // Row 3: Mention Users
                    const userSelect = new UserSelectMenuBuilder()
                        .setCustomId('announce_mention_users')
                        .setPlaceholder('Select Users to Mention')
                        .setMinValues(0)
                        .setMaxValues(25);

                    // Row 4: Buttons
                    const setMessageBtn = new ButtonBuilder()
                        .setCustomId('announce_set_message')
                        .setLabel('Set Message')
                        .setEmoji('✏️')
                        .setStyle(ButtonStyle.Primary);

                    const sendBtn = new ButtonBuilder()
                        .setCustomId('announce_send')
                        .setLabel('Send Announcement')
                        .setEmoji('🚀')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(!data.channelId || !data.message);

                    const cancelBtn = new ButtonBuilder()
                        .setCustomId('announce_cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Danger);

                    const rows = [
                        new ActionRowBuilder().addComponents(channelSelect),
                        new ActionRowBuilder().addComponents(roleSelect),
                        new ActionRowBuilder().addComponents(userSelect),
                        new ActionRowBuilder().addComponents(setMessageBtn, sendBtn, cancelBtn)
                    ];

                    const payload = {
                        embeds: [dashboardEmbed],
                        components: rows,
                        ephemeral: true
                    };

                    if (isUpdate) {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.editReply(payload);
                        } else {
                            await interaction.update(payload);
                        }
                    } else {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.followUp(payload);
                        } else {
                            await interaction.reply(payload);
                        }
                    }
                },

                async handleInteraction(interaction) {
                    const userId = interaction.user.id;
                    const data = interactionCache.get(userId);

                    if (!data) {
                        if (interaction.isButton() || interaction.isAnySelectMenu()) {
                            return interaction.reply({ content: '❌ Session expired. Please run /announce again.', ephemeral: true });
                        }
                        return;
                    }

                    // --- Handle Select Menus ---
                    if (interaction.customId === 'announce_target_channel') {
                        data.channelId = interaction.values[0];
                        interactionCache.set(userId, data);
                        await this.renderDashboard(interaction, true);
                    }
                    else if (interaction.customId === 'announce_mention_roles') {
                        data.mentionRoles = interaction.values;
                        interactionCache.set(userId, data);
                        await this.renderDashboard(interaction, true);
                    }
                    else if (interaction.customId === 'announce_mention_users') {
                        data.mentionUsers = interaction.values;
                        interactionCache.set(userId, data);
                        await this.renderDashboard(interaction, true);
                    }

                    // --- Handle Buttons ---
                    else if (interaction.customId === 'announce_set_message') {
                        await interaction.deferUpdate();
                        const msg = await interaction.followUp({
                            content: '✍️ **Please type your announcement message in this channel now.**\n\n- You can use multiple lines, emojis, and formatting.\n- Max 2000 characters.\n- Type `cancel` to abort.',
                            ephemeral: true
                        });

                        const filter = m => m.author.id === userId;
                        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 120000 });

                        collector.on('collect', async m => {
                            if (m.content.toLowerCase() === 'cancel') {
                                await interaction.followUp({ content: '❌ Message setup cancelled.', ephemeral: true });
                            } else {
                                data.message = m.content;
                                interactionCache.set(userId, data);
                                await interaction.followUp({ content: '✅ Message captured!', ephemeral: true });

                                // Try to delete the user's message to keep chat clean
                                try { await m.delete(); } catch (e) { /* Ignore if missing permissions */ }
                            }

                            // Refresh dashboard
                            await this.renderDashboard(interaction, true);
                        });
                    }

                    else if (interaction.customId === 'announce_cancel') {
                        interactionCache.delete(userId);
                        await interaction.update({ content: '❌ Announcement cancelled.', embeds: [], components: [] });
                    }

                    else if (interaction.customId === 'announce_send') {
                        await interaction.deferUpdate();
                        try {
                            const channel = await interaction.guild.channels.fetch(data.channelId);

                            // Construct Mentions
                            const mentions = [
                                ...data.mentionRoles.map(id => `<@&${id}>`),
                                ...data.mentionUsers.map(id => `<@${id}>`)
                            ];
                            const mentionString = mentions.join(' ');

                            // Construct Final Message Content
                            // Combine Message + Mentions
                            let finalContent = data.message;
                            if (mentionString.length > 0) {
                                finalContent += `\n\n${mentionString}`;
                            }

                            // Handle Attachment
                            const files = [];
                            if (data.attachment) {
                                files.push(data.attachment.url);
                            }

                            // Handle Link (Add Button)
                            const components = [];
                            if (data.link) {
                                const linkBtn = new ButtonBuilder()
                                    .setLabel('🔗 Open Link')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(data.link);

                                components.push(new ActionRowBuilder().addComponents(linkBtn));
                            }

                            await channel.send({
                                content: finalContent,
                                files: files,
                                components: components
                            });

                            await interaction.editReply({ content: `✅ Announcement sent to ${channel}!`, embeds: [], components: [] });
                            interactionCache.delete(userId);

                        } catch (error) {
                            console.error(error);
                            await interaction.editReply({ content: `❌ Failed to send: ${error.message}`, ephemeral: true });
                        }
                    }
                }
            };