import { Events } from 'discord.js';
export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); }
        catch (error) { console.error(error); await interaction.reply({ content: 'Error executing command', ephemeral: true }); }
    }
};