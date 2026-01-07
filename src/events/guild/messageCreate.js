import { Events, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { db, saveDB } from '../../database/index.js';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Handle DMs - ModMail System
        if (message.channel.type === ChannelType.DM) {
            const guild = message.client.guilds.cache.first();
            if (!guild) return;

            const categoryId = process.env.MODMAIL_CATEGORY_ID;
            if (!categoryId) {
                console.error('MODMAIL_CATEGORY_ID not set in .env');
                return message.reply('❌ ModMail system is not configured.');
            }

            // Check if user already has a ticket
            const cleanUsername = message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
            let ticketChannel = guild.channels.cache.find(
                ch => ch.topic && ch.topic.includes(message.author.id) && ch.parentId === categoryId
            );

            // Create new ticket if doesn't exist
            if (!ticketChannel) {
                try {
                    // Check if user is banned
                    const ban = await guild.bans.fetch(message.author.id).catch(() => null);
                    const isBanned = !!ban;
                    const channelName = isBanned ? `unban-${cleanUsername}` : `ticket-${cleanUsername}`;

                    ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        topic: `ModMail ticket for ${message.author.tag} (${message.author.id})`,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: message.client.user.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                            },
                        ],
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor(isBanned ? '#FF0000' : '#00FF00')
                        .setTitle(isBanned ? '🔓 Unban Request' : '📨 New ModMail Ticket')
                        .setDescription(`**User:** ${message.author.tag} (${message.author.id})\n**Account Created:** <t:${Math.floor(message.author.createdTimestamp / 1000)}:R>`)
                        .setThumbnail(message.author.displayAvatarURL())
                        .setTimestamp();

                    if (isBanned) {
                        welcomeEmbed.addFields({ name: '⚠️ Status', value: 'User is currently BANNED from the server.' });
                    }

                    await ticketChannel.send({ embeds: [welcomeEmbed] });
                    await message.react('✅');
                } catch (error) {
                    console.error('Error creating ticket:', error);
                    return message.reply('❌ Failed to create ticket. Please contact an administrator.');
                }
            }

            // Forward message to ticket channel
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content || '*[No text content]*')
                .setFooter({ text: `User ID: ${message.author.id}` })
                .setTimestamp();

            // Handle Image Attachment inside Embed
            const imageAttachment = message.attachments.find(a => a.contentType && a.contentType.startsWith('image/'));
            if (imageAttachment) {
                embed.setImage(imageAttachment.url);
            }

            // Other attachments (files)
            const otherAttachments = message.attachments.filter(a => !a.contentType || !a.contentType.startsWith('image/')).map(a => a.url);

            try {
                // Send main message
                await ticketChannel.send({
                    content: message.content, // Sending content outside embed triggers link previews
                    embeds: [embed],
                    files: otherAttachments
                });
            } catch (error) {
                console.error('Error forwarding message:', error);
            }
        }

        // Handle staff replies in ticket channels
        if (message.guild && message.channel.parentId === process.env.MODMAIL_CATEGORY_ID) {
            if (message.content.startsWith('!')) {
                // Handle commands
                if (message.content === '!close') {
                    const userId = message.channel.topic.match(/\((\d+)\)/)?.[1];
                    try {
                        const user = await message.client.users.fetch(userId);
                        await user.send({
                            embeds: [new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('🔒 Ticket Closed')
                                .setDescription('Your ModMail ticket has been closed by staff.')
                                .setTimestamp()]
                        });
                    } catch (error) {
                        console.error('Could not DM user:', error);
                    }

                    await message.channel.send('✅ Ticket closed. Deleting channel in 5 seconds...');
                    setTimeout(() => message.channel.delete().catch(console.error), 5000);
                    return;
                }
                return; // Ignore other commands
            }

            // Forward staff reply to user
            const userId = message.channel.topic.match(/\((\d+)\)/)?.[1];
            try {
                const user = await message.client.users.fetch(userId);
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: 'Staff Reply', iconURL: message.author.displayAvatarURL() })
                    .setDescription(message.content || '*[No text content]*')
                    .setTimestamp();

                // Handle Image Attachment inside Embed
                const imageAttachment = message.attachments.find(a => a.contentType && a.contentType.startsWith('image/'));
                if (imageAttachment) {
                    embed.setImage(imageAttachment.url);
                }

                // Other attachments (files)
                const otherAttachments = message.attachments.filter(a => !a.contentType || !a.contentType.startsWith('image/')).map(a => a.url);

                await user.send({
                    content: message.content, // Triggers link preview for user
                    embeds: [embed],
                    files: otherAttachments
                });
                await message.react('✅');
            } catch (error) {
                await message.react('❌');
                console.error('Error sending reply to user:', error);
            }
        }
    }
};
