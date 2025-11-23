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
                const parts = interaction.customId.split('_');
                const channelId = parts[2];
                const mentions = parts.slice(3).join('_') || '';

                const title = interaction.fields.getTextInputValue('announce_title');
                const message = interaction.fields.getTextInputValue('announce_message');
                const color = interaction.fields.getTextInputValue('announce_color') || '#FF0000';

                try {
                    const channel = await interaction.guild.channels.fetch(channelId);

                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle(`📢 ${title}`)
                        .setDescription(message)
                        .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    await channel.send({
                        content: mentions || null,
                        embeds: [embed]
                    });

                    await interaction.reply({ content: `✅ Announcement sent to ${channel}`, ephemeral: true });
                } catch (error) {
                    console.error('Announcement error:', error);
                    await interaction.reply({ content: `❌ Failed to send announcement: ${error.message}`, ephemeral: true });
                }
            }
        }
    }
};