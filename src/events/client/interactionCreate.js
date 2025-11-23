import { Events, EmbedBuilder } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            }
            catch (error) {
                console.error(error);
                const errorMsg = { content: 'Error executing command', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMsg).catch(() => { });
                } else {
                    await interaction.reply(errorMsg).catch(() => { });
                }
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('announce_modal_')) {
                // Extract cache key from custom ID
                const cacheKey = interaction.customId.replace('announce_modal_', '');

                // Import the mention cache
                const { mentionCache } = await import('../commands/admin/announce.js');
                const cachedData = mentionCache.get(cacheKey);

                if (!cachedData) {
                    return interaction.reply({
                        content: '❌ Announcement session expired. Please try again.',
                        ephemeral: true
                    });
                }

                const title = interaction.fields.getTextInputValue('announce_title');
                const message = interaction.fields.getTextInputValue('announce_message');
                const color = interaction.fields.getTextInputValue('announce_color') || '#FF0000';

                try {
                    const channel = await interaction.guild.channels.fetch(cachedData.channelId);

                    // Build mention string
                    let mentionString = '';
                    if (cachedData.mentionType === 'everyone') {
                        mentionString = '@everyone';
                    } else if (cachedData.mentionType === 'here') {
                        mentionString = '@here';
                    } else if (cachedData.mentionType === 'custom' && cachedData.mentions.length > 0) {
                        // Format all mentions
                        const mentionStrings = cachedData.mentions.map(id => {
                            // Check if it's a role or user
                            const role = interaction.guild.roles.cache.get(id);
                            if (role) {
                                return `<@&${id}>`;
                            } else {
                                return `<@${id}>`;
                            }
                        });
                        mentionString = mentionStrings.join(' ');
                    }

                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle(`📢 ${title}`)
                        .setDescription(message)
                        .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    await channel.send({
                        content: mentionString || null,
                        embeds: [embed]
                    });

                    await interaction.reply({ content: `✅ Announcement sent to ${channel}`, ephemeral: true });

                    // Clean up cache
                    mentionCache.delete(cacheKey);
                } catch (error) {
                    console.error('Announcement error:', error);
                    await interaction.reply({ content: `❌ Failed to send announcement: ${error.message}`, ephemeral: true });
                }
            }
        }
    }
};