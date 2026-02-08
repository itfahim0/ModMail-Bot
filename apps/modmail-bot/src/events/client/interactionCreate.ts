import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    Events,
    MessageFlags,
    PermissionFlagsBits,
} from 'discord.js';

import { checkRateLimit } from '../../middleware/rateLimit.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorMsg = {
                    content: 'Error executing command',
                    flags: MessageFlags.Ephemeral,
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMsg).catch(() => {});
                } else {
                    await interaction.reply(errorMsg).catch(() => {});
                }
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('announce_')) {
                const command = interaction.client.commands.get('announce');
                if (command && command.handleInteraction) {
                    await command.handleInteraction(interaction);
                    return;
                }
            }
        }

        // Handle All Components (Select Menus & Buttons)
        if (interaction.isMessageComponent()) {
            // Existing announce button handling
            if (interaction.customId.startsWith('announce_')) {
                const command = interaction.client.commands.get('announce');
                if (command && command.handleInteraction) {
                    await command.handleInteraction(interaction);
                    return;
                }
            }

            // Handle Unban Request Button
            if (interaction.customId.startsWith('request_unban_')) {
                // Defer reply immediately to prevent timeout
                await interaction.deferReply({ ephemeral: true });

                const guildId = interaction.customId.split('_')[2];
                const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);

                if (!guild) {
                    return interaction.editReply({
                        content: '❌ Server not found or bot is no longer in the server.',
                    });
                }

                // Check if ModMail is set up
                const categoryId = process.env.MODMAIL_CATEGORY_ID;
                if (!categoryId) {
                    return interaction.editReply({
                        content: '❌ Unban requests are not currently accepted via this method.',
                    });
                }

                // Check for existing ticket
                const cleanUsername = interaction.user.username
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-');
                let ticketChannel = guild.channels.cache.find(
                    (ch) =>
                        ch.topic &&
                        ch.topic.includes(interaction.user.id) &&
                        ch.parentId === categoryId,
                );

                if (ticketChannel) {
                    return interaction.editReply({
                        content: '✅ You already have an open ticket. Please check your DMs.',
                    });
                }

                try {
                    // Create Ticket
                    ticketChannel = await guild.channels.create({
                        name: `unban-${cleanUsername}`,
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        topic: `Unban Request for ${interaction.user.tag} (${interaction.user.id})`,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.client.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                ],
                            },
                        ],
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🔓 New Unban Request')
                        .setDescription(
                            `**User:** ${interaction.user.tag} (${interaction.user.id})\n**Account Created:** <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:R>\n\nUser clicked "Request Unban" button.`,
                        )
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();

                    await ticketChannel.send({ embeds: [welcomeEmbed] });

                    await interaction.editReply({
                        content:
                            '✅ Unban request submitted! A staff member will review it shortly. You can reply here to provide more details.',
                    });
                } catch (error) {
                    console.error('Error creating unban ticket:', error);
                    await interaction.editReply({ content: '❌ Failed to create unban request.' });
                }
                return;
            }

            // New close confirmation button handling
            if (interaction.customId === 'confirm_close') {
                // Extract reason from the original message content
                const reasonMatch = interaction.message.content.match(/Reason:\s*(.*)/i);
                const reason = reasonMatch ? reasonMatch[1].trim() : 'No reason provided';
                const channel = interaction.channel;
                const userId = channel.topic?.match(/\((\d+)\)/)?.[1];
                // DM the user
                if (userId) {
                    try {
                        const user = await interaction.client.users.fetch(userId);
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🔒 Ticket Closed')
                            .setDescription(
                                `Your ticket has been closed by staff.\n**Reason:** ${reason}`,
                            )
                            .setTimestamp();
                        await user.send({ embeds: [embed] });
                    } catch (e) {
                        console.error('Failed to DM user on close:', e);
                    }
                }
                // Log action if LOG_CHANNEL_ID is set
                const logChannelId = process.env.LOG_CHANNEL_ID;
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Ticket Closed')
                            .addFields(
                                { name: 'Channel', value: channel.name, inline: true },
                                { name: 'Closed By', value: interaction.user.tag, inline: true },
                                { name: 'Reason', value: reason },
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
                // Delete the channel after a short delay
                await interaction.update({
                    content: '✅ Ticket will be deleted shortly...',
                    components: [],
                });
                setTimeout(() => channel.delete().catch(() => {}), 5000);
                return;
            }
        }
    },
};
