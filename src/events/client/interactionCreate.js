import { Events, EmbedBuilder, MessageFlags } from 'discord.js';

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
                const errorMsg = { content: 'Error executing command', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMsg).catch(() => { });
                } else {
                    await interaction.reply(errorMsg).catch(() => { });
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
            if (interaction.customId.startsWith('announce_')) {
                const command = interaction.client.commands.get('announce');
                if (command && command.handleInteraction) {
                    await command.handleInteraction(interaction);
                    return;
                }
            }
        }
    }
};