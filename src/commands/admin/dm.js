import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

// Cache to store temporary data
const dmCache = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a user with advanced options')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to DM')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Upload a file (Image, Video, PDF, etc.)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Add an external link')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const attachment = interaction.options.getAttachment('attachment');
        const link = interaction.options.getString('link');
        const userId = interaction.user.id;

        // Check attachment size
        if (attachment && attachment.size > 8 * 1024 * 1024) {
            return interaction.reply({
                content: '❌ **File too large!**\nPlease upload a file smaller than 8MB.',
                ephemeral: true
            });
        }

        // Initialize cache
        dmCache.set(userId, {
            targetUser: targetUser,
            attachment: attachment,
            link: link,
            message: '', // Will be set via interactive chat
            color: '#0099ff'
        });

        await this.renderDashboard(interaction);
    },

    async renderDashboard(interaction, isUpdate = false) {
        const userId = interaction.user.id;
        const data = dmCache.get(userId);

        if (!data) {
            return interaction.reply({ content: '❌ Session expired. Please run /dm again.', ephemeral: true });
        }

        // --- Build Dashboard Embed ---
        const dashboardEmbed = new EmbedBuilder()
            .setTitle(`📨 DM to ${data.targetUser.tag}`)
            .setDescription('Configure your direct message below.\n\n**Preview of Message Content:**')
            .setColor(data.color)
            .setThumbnail(data.targetUser.displayAvatarURL())
            .setTimestamp();

        if (data.message) {
            dashboardEmbed.addFields({ name: 'Content', value: data.message.length > 1024 ? data.message.substring(0, 1021) + '...' : data.message });
        } else {
            dashboardEmbed.addFields({ name: 'Content', value: '*No message set. Click "Set Message" to type it.*' });
        }

        // Preview Image
        if (data.attachment && data.attachment.contentType && data.attachment.contentType.startsWith('image/')) {
            dashboardEmbed.setImage(data.attachment.url);
        }

        // --- Build Status Fields ---
        let status = `**Target:** ${data.targetUser.tag}`;
        if (data.attachment) status += `\n**Attachment:** ${data.attachment.name}`;
        if (data.link) status += `\n**Link:** ${data.link}`;

        dashboardEmbed.addFields({ name: 'Details', value: status });

        // --- Build Components ---
        const setMessageBtn = new ButtonBuilder()
            .setCustomId('dm_set_message')
            .setLabel('Set Message')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary);

        const sendBtn = new ButtonBuilder()
            .setCustomId('dm_send')
            .setLabel('Send DM')
            .setEmoji('🚀')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!data.message);

        const cancelBtn = new ButtonBuilder()
            .setCustomId('dm_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(setMessageBtn, sendBtn, cancelBtn);

        const payload = {
            embeds: [dashboardEmbed],
            components: [row],
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
        const data = dmCache.get(userId);

        if (!data) {
            if (interaction.isButton()) {
                return interaction.reply({ content: '❌ Session expired. Please run /dm again.', ephemeral: true });
            }
            return;
        }

        if (interaction.customId === 'dm_set_message') {
            await interaction.deferUpdate();
            await interaction.followUp({
                content: '✍️ **Please type the DM content in this channel now.**\nType `cancel` to abort.',
                ephemeral: true
            });

            const filter = m => m.author.id === userId;
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 120000 });

            collector.on('collect', async m => {
                if (m.content.toLowerCase() === 'cancel') {
                    await interaction.followUp({ content: '❌ Message setup cancelled.', ephemeral: true });
                } else {
                    data.message = m.content;
                    dmCache.set(userId, data);
                    await interaction.followUp({ content: '✅ Message captured!', ephemeral: true });
                    try { await m.delete(); } catch (e) { }
                }
                await this.renderDashboard(interaction, true);
            });
        }
        else if (interaction.customId === 'dm_cancel') {
            dmCache.delete(userId);
            await interaction.update({ content: '❌ DM cancelled.', embeds: [], components: [] });
        }
        else if (interaction.customId === 'dm_send') {
            await interaction.deferUpdate();
            try {
                const embed = new EmbedBuilder()
                    .setColor(data.color)
                    .setAuthor({ name: `Message from ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                    .setDescription(data.message)
                    .setFooter({ text: `Sent by ${interaction.user.tag}` })
                    .setTimestamp();

                // Image in embed
                if (data.attachment && data.attachment.contentType.startsWith('image/')) {
                    embed.setImage(data.attachment.url);
                }

                // Files (non-image or fallback)
                const files = [];
                if (data.attachment && !data.attachment.contentType.startsWith('image/')) {
                    files.push(data.attachment.url);
                }

                // Components (Link)
                const components = [];
                if (data.link) {
                    components.push(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('🔗 Open Link').setStyle(ButtonStyle.Link).setURL(data.link)
                    ));
                }

                await data.targetUser.send({
                    embeds: [embed],
                    files: files,
                    components: components
                });

                await interaction.editReply({ content: `✅ DM sent to **${data.targetUser.tag}**!`, embeds: [], components: [] });
                dmCache.delete(userId);

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: `❌ Failed to send DM: ${error.message} (User likely has DMs off)`, ephemeral: true });
            }
        }
    }
};
