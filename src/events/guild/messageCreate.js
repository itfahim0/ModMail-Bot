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
                    ticketChannel = await guild.channels.create({
                        name: `ticket-${cleanUsername}`,
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
                        .setColor('#00FF00')
                        .setTitle('📨 New ModMail Ticket')
                        .setDescription(`**User:** ${message.author.tag} (${message.author.id})\n**Account Created:** <t:${Math.floor(message.author.createdTimestamp / 1000)}:R>`)
                        .setThumbnail(message.author.displayAvatarURL())
                        .setTimestamp();

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

            try {
                await ticketChannel.send({
                    embeds: [embed],
                    files: message.attachments.map(a => a.url)
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

                await user.send({
                    embeds: [embed],
                    files: message.attachments.map(a => a.url)
                });
                await message.react('✅');
            } catch (error) {
                await message.react('❌');
                console.error('Error sending reply to user:', error);
            }
        }
    }
};
